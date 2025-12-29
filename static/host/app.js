const statusEl = document.getElementById("status");
const tokenInput = document.getElementById("token-input");
const connectBtn = document.getElementById("connect-btn");
const refreshBtn = document.getElementById("refresh-btn");
const characterNameEl = document.getElementById("character-name");
const characterClassEl = document.getElementById("character-class");
const characterLevelEl = document.getElementById("character-level");
const levelIndicatorEl = document.getElementById("level-indicator");
const xpCurrentEl = document.getElementById("xp-current");
const xpNextEl = document.getElementById("xp-next");
const xpFillEl = document.getElementById("xp-fill");
const xpInput = document.getElementById("xp-input");
const xpSubmitBtn = document.getElementById("xp-submit");
const xpStatusEl = document.getElementById("xp-status");
const statsList = document.getElementById("stats-list");
const resourcesList = document.getElementById("resources-list");
const currenciesList = document.getElementById("currencies-list");
const reputationsList = document.getElementById("reputations-list");
const inventoryList = document.getElementById("inventory-list");
const inventoryCountEl = document.getElementById("inventory-count");
const itemCard = document.getElementById("item-card");
const equipmentGrid = document.getElementById("equipment-grid");

const EQUIPMENT_SLOTS = [
  { key: "weapon_1", label: "Оружие 1" },
  { key: "weapon_2", label: "Оружие 2" },
  { key: "head", label: "Голова" },
  { key: "torso", label: "Торс" },
  { key: "legs", label: "Ноги" },
  { key: "boots", label: "Ботинки" },
  { key: "ring_1", label: "Кольцо 1" },
  { key: "ring_2", label: "Кольцо 2" },
];

const ITEM_TYPE_SLOT_HINTS = {
  weapon: ["weapon_1", "weapon_2"],
  armor: ["head", "torso", "legs", "boots"],
  accessory: ["ring_1", "ring_2"],
};

const state = {
  token: "",
  snapshot: null,
  settings: null,
  character: null,
  classes: {},
  templates: {},
  selectedItemId: null,
  lastLevelUp: null,
  socket: null,
};

function setStatus(message, variant = "") {
  statusEl.textContent = message;
  statusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    statusEl.classList.add(`status--${variant}`);
  }
}

function setXpStatus(message, variant = "") {
  xpStatusEl.textContent = message;
  xpStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    xpStatusEl.classList.add(`status--${variant}`);
  }
}

function saveToken(token) {
  localStorage.setItem("hostToken", token);
  state.token = token;
}

function getToken() {
  return state.token || tokenInput.value.trim();
}

function computeXpToNext(level, curve) {
  if (!curve) {
    return 0;
  }
  return Math.round(curve.base_xp * Math.pow(curve.growth_rate, level - 1));
}

function applyXpGranted(amount) {
  if (!state.character || !state.settings) {
    return;
  }
  let xp = state.character.xp + amount;
  let level = state.character.level;
  while (true) {
    const need = computeXpToNext(level, state.settings.xp_curve);
    if (need <= 0) {
      break;
    }
    if (xp >= need) {
      xp -= need;
      level += 1;
    } else {
      break;
    }
  }
  state.character.level = level;
  state.character.xp = xp;
}

function applyLevelUpEvent(payload) {
  if (!state.character) {
    return;
  }
  const gained = Number(payload.stat_points_gained ?? 0);
  state.character.unspent_stat_points =
    Number(state.character.unspent_stat_points ?? 0) + gained;
  const classDef = state.classes?.[state.character.class_id];
  const bonus = classDef?.per_level_bonus ?? {};
  Object.entries(bonus).forEach(([stat, delta]) => {
    const current = Number(state.character.stats?.[stat] ?? 0);
    state.character.stats[stat] = current + Number(delta);
  });
  state.lastLevelUp = {
    level: payload.new_level,
    ts: payload.ts,
  };
}

function applyInventoryAdded(payload) {
  if (!state.character) {
    return;
  }
  if (!state.character.inventory) {
    state.character.inventory = {};
  }
  state.character.inventory[payload.item_instance_id] = {
    id: payload.item_instance_id,
    template_id: payload.template_id,
    qty: payload.qty ?? 1,
    custom_name: null,
    bound: false,
    meta: {},
  };
}

function applyInventoryRemoved(payload) {
  if (!state.character || !state.character.inventory) {
    return;
  }
  delete state.character.inventory[payload.item_instance_id];
  if (state.character.equipment) {
    Object.keys(state.character.equipment).forEach((slot) => {
      if (state.character.equipment[slot] === payload.item_instance_id) {
        state.character.equipment[slot] = null;
      }
    });
  }
}

function applyEquipmentEquipped(payload) {
  if (!state.character) {
    return;
  }
  if (!state.character.equipment) {
    state.character.equipment = {};
  }
  const slot = payload.slot;
  const itemId = payload.item_instance_id;
  const template = findTemplateForItem(itemId);
  if (
    template?.two_handed &&
    (slot === "weapon_1" || slot === "weapon_2")
  ) {
    state.character.equipment.weapon_1 = itemId;
    state.character.equipment.weapon_2 = itemId;
  } else {
    state.character.equipment[slot] = itemId;
  }
}

function applyEquipmentUnequipped(payload) {
  if (!state.character || !state.character.equipment) {
    return;
  }
  state.character.equipment[payload.slot] = null;
}

function applyEvent(event) {
  switch (event.kind) {
    case "xp.granted":
      applyXpGranted(Number(event.payload.amount ?? 0));
      break;
    case "level.up":
      applyLevelUpEvent({ ...event.payload, ts: event.ts });
      break;
    case "inventory.added":
      applyInventoryAdded(event.payload);
      break;
    case "inventory.removed":
      applyInventoryRemoved(event.payload);
      break;
    case "equipment.equipped":
      applyEquipmentEquipped(event.payload);
      break;
    case "equipment.unequipped":
      applyEquipmentUnequipped(event.payload);
      break;
    default:
      break;
  }
}

function applyEvents(events) {
  events.forEach(applyEvent);
  render();
}

function applySnapshot(snapshot) {
  state.snapshot = snapshot;
  state.character = snapshot.character || null;
  state.classes = snapshot.classes || {};
  state.templates = snapshot.item_templates || {};
  state.settings = snapshot.settings || null;
  if (!state.character?.equipment) {
    state.character.equipment = {};
  }
  if (!state.character?.inventory) {
    state.character.inventory = {};
  }
  if (state.selectedItemId && !state.character.inventory[state.selectedItemId]) {
    state.selectedItemId = null;
  }
  render();
}

function connectEventStream(token, afterSeq = 0) {
  if (state.socket) {
    state.socket.close();
  }
  const wsBase = window.location.origin.replace(/^http/, "ws");
  const socket = new WebSocket(
    `${wsBase}/ws?token=${encodeURIComponent(token)}&after_seq=${afterSeq}`,
  );
  socket.addEventListener("open", () => {
    setStatus("Подключено", "ok");
  });
  socket.addEventListener("close", () => {
    setStatus("Соединение закрыто");
  });
  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    if (payload.type !== "events") {
      return;
    }
    applyEvents(payload.items ?? []);
  });
  state.socket = socket;
}

async function fetchSnapshot() {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  setStatus("Подключение...");
  try {
    const response = await fetch("/api/snapshot", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Не удалось загрузить snapshot");
    }
    const payload = await response.json();
    saveToken(token);
    applySnapshot(payload.snapshot || {});
    connectEventStream(token, payload.last_seq ?? 0);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

function findTemplateForItem(itemId) {
  const item = state.character?.inventory?.[itemId];
  if (!item) {
    return null;
  }
  return state.templates?.[item.template_id] || null;
}

function getItemName(item) {
  const template = state.templates?.[item.template_id];
  return item.custom_name || template?.name || "Неизвестный предмет";
}

function getItemSlots(item) {
  const template = state.templates?.[item.template_id];
  if (!template) {
    return [];
  }
  const explicitSlots = template.equip_slots || [];
  let slots = explicitSlots.length ? explicitSlots : ITEM_TYPE_SLOT_HINTS[template.item_type] || [];
  const classDef = state.classes?.[state.character?.class_id];
  if (classDef?.allowed_slots?.length) {
    slots = slots.filter((slot) => classDef.allowed_slots.includes(slot));
  }
  if (classDef?.allowed_item_types?.length) {
    if (!classDef.allowed_item_types.includes(template.item_type)) {
      slots = [];
    }
  }
  return slots;
}

function renderList(container, items, emptyMessage) {
  container.innerHTML = "";
  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list__item";
    empty.textContent = emptyMessage;
    container.appendChild(empty);
    return;
  }
  items.forEach(({ label, value }) => {
    const row = document.createElement("div");
    row.className = "list__item";
    const name = document.createElement("span");
    name.textContent = label;
    const val = document.createElement("span");
    val.textContent = value;
    row.appendChild(name);
    row.appendChild(val);
    container.appendChild(row);
  });
}

function renderSheet() {
  if (!state.character) {
    return;
  }
  const classDef = state.classes?.[state.character.class_id];
  characterNameEl.textContent = state.character.name || "Без имени";
  characterClassEl.textContent = classDef
    ? `Класс: ${classDef.name}`
    : "Класс —";
  characterLevelEl.textContent = state.character.level ?? 1;
  if (state.lastLevelUp) {
    levelIndicatorEl.hidden = false;
    levelIndicatorEl.textContent = `LEVEL UP · ${state.lastLevelUp.level}`;
  } else {
    levelIndicatorEl.hidden = true;
  }
  const xpToNext = computeXpToNext(
    state.character.level ?? 1,
    state.settings?.xp_curve,
  );
  const currentXp = state.character.xp ?? 0;
  xpCurrentEl.textContent = `XP: ${currentXp}`;
  xpNextEl.textContent = xpToNext ? `До уровня: ${xpToNext}` : "До уровня: —";
  if (xpToNext) {
    const pct = Math.min(100, Math.round((currentXp / xpToNext) * 100));
    xpFillEl.style.width = `${pct}%`;
  } else {
    xpFillEl.style.width = "0%";
  }

  const stats = Object.entries(state.character.stats || {}).map(([key, value]) => ({
    label: key,
    value,
  }));
  stats.push({
    label: "Нераспр. очки",
    value: state.character.unspent_stat_points ?? 0,
  });

  const resources = Object.entries(state.character.resources || {}).map(
    ([key, value]) => ({
      label: key,
      value: `${value[0]}/${value[1]}`,
    }),
  );
  const currencies = Object.entries(state.character.currencies || {}).map(
    ([key, value]) => ({ label: key, value }),
  );
  const reputations = Object.entries(state.character.reputations || {}).map(
    ([key, value]) => ({ label: key, value }),
  );

  renderList(statsList, stats, "Нет статов");
  renderList(resourcesList, resources, "Нет ресурсов");
  renderList(currenciesList, currencies, "Нет валют");
  renderList(reputationsList, reputations, "Нет репутаций");
}

function renderInventory() {
  inventoryList.innerHTML = "";
  const items = Object.values(state.character?.inventory || {});
  inventoryCountEl.textContent = `${items.length} предметов`;
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "item-card__empty";
    empty.textContent = "Инвентарь пуст";
    inventoryList.appendChild(empty);
    return;
  }
  const sorted = items.sort((a, b) => {
    const nameA = getItemName(a).toLowerCase();
    const nameB = getItemName(b).toLowerCase();
    return nameA.localeCompare(nameB, "ru");
  });
  sorted.forEach((item) => {
    const card = document.createElement("div");
    card.className = "inventory-item";
    if (state.selectedItemId === item.id) {
      card.classList.add("active");
    }
    const title = document.createElement("div");
    title.className = "inventory-item__title";
    title.textContent = getItemName(item);

    const qty = document.createElement("span");
    qty.className = "tag";
    qty.textContent = `x${item.qty}`;
    title.appendChild(qty);

    const subtitle = document.createElement("div");
    subtitle.className = "meta";
    const template = state.templates?.[item.template_id];
    subtitle.textContent = template
      ? `${template.item_type} · ${template.rarity}`
      : "тип неизвестен";

    const equippedSlot = Object.entries(state.character.equipment || {}).find(
      ([, itemId]) => itemId === item.id,
    );
    if (equippedSlot) {
      const equipped = document.createElement("span");
      equipped.className = "tag";
      equipped.textContent = `Экипировано: ${equippedSlot[0]}`;
      card.appendChild(equipped);
    }

    card.appendChild(title);
    card.appendChild(subtitle);
    card.addEventListener("click", () => {
      state.selectedItemId = item.id;
      render();
    });
    inventoryList.appendChild(card);
  });
}

function renderItemCard() {
  itemCard.innerHTML = "";
  if (!state.selectedItemId) {
    const empty = document.createElement("div");
    empty.className = "item-card__empty";
    empty.textContent = "Выберите предмет для деталей";
    itemCard.appendChild(empty);
    return;
  }
  const item = state.character?.inventory?.[state.selectedItemId];
  if (!item) {
    return;
  }
  const template = state.templates?.[item.template_id];
  const title = document.createElement("div");
  title.className = "item-card__title";
  title.textContent = getItemName(item);

  const meta = document.createElement("div");
  meta.className = "item-card__meta";
  if (template) {
    const typeTag = document.createElement("span");
    typeTag.className = "tag";
    typeTag.textContent = template.item_type;
    meta.appendChild(typeTag);
    const rarityTag = document.createElement("span");
    rarityTag.className = "tag";
    rarityTag.textContent = template.rarity;
    meta.appendChild(rarityTag);
    if (template.two_handed) {
      const twoHandedTag = document.createElement("span");
      twoHandedTag.className = "tag";
      twoHandedTag.textContent = "двуручное";
      meta.appendChild(twoHandedTag);
    }
  }

  const description = document.createElement("div");
  description.className = "meta";
  description.textContent = template?.description || "Описание отсутствует.";

  const actions = document.createElement("div");
  actions.className = "item-card__actions";

  const slots = getItemSlots(item);
  if (slots.length) {
    slots.forEach((slot) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = `Экипировать: ${slot}`;
      button.className = "ghost";
      button.addEventListener("click", () => equipItem(item.id, slot, button));
      actions.appendChild(button);
    });
  } else {
    const note = document.createElement("div");
    note.className = "meta";
    note.textContent = "Нет доступных слотов для экипировки.";
    actions.appendChild(note);
  }

  itemCard.appendChild(title);
  itemCard.appendChild(meta);
  itemCard.appendChild(description);
  itemCard.appendChild(actions);
}

function renderEquipment() {
  equipmentGrid.innerHTML = "";
  const equipment = state.character?.equipment || {};
  const selectedItem = state.selectedItemId
    ? state.character?.inventory?.[state.selectedItemId]
    : null;
  const selectedSlots = selectedItem ? getItemSlots(selectedItem) : [];

  EQUIPMENT_SLOTS.forEach(({ key, label }) => {
    const slotEl = document.createElement("div");
    slotEl.className = "slot";
    if (selectedSlots.includes(key)) {
      slotEl.classList.add("slot--highlight");
    }

    const name = document.createElement("div");
    name.className = "slot__name";
    name.textContent = label;

    const itemId = equipment?.[key];
    const itemEl = document.createElement("div");
    itemEl.className = "slot__item";
    if (!itemId) {
      itemEl.classList.add("empty");
      itemEl.textContent = "Пусто";
    } else {
      const item = state.character?.inventory?.[itemId];
      const template = state.templates?.[item?.template_id];
      const suffix =
        template?.two_handed && (key === "weapon_1" || key === "weapon_2")
          ? " (двуручное)"
          : "";
      itemEl.textContent = `${getItemName(item)}${suffix}`;
    }

    slotEl.appendChild(name);
    slotEl.appendChild(itemEl);
    if (selectedItem && selectedSlots.includes(key)) {
      slotEl.addEventListener("click", () => equipItem(selectedItem.id, key, slotEl));
    }
    equipmentGrid.appendChild(slotEl);
  });
}

function render() {
  if (!state.character) {
    return;
  }
  renderSheet();
  renderInventory();
  renderItemCard();
  renderEquipment();
}

async function equipItem(itemId, slot, element) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  if (element) {
    element.disabled = true;
  }
  setXpStatus("Экипировка предмета...");
  try {
    const response = await fetch("/api/host/equip", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ item_instance_id: itemId, slot }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось экипировать предмет");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setXpStatus("Предмет экипирован", "ok");
  } catch (error) {
    setXpStatus(error.message, "error");
  } finally {
    if (element) {
      element.disabled = false;
    }
  }
}

async function grantXp(amount) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  if (!amount || amount <= 0) {
    setXpStatus("Введите значение XP", "error");
    return;
  }
  xpSubmitBtn.disabled = true;
  try {
    const response = await fetch("/api/host/grant-xp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ amount }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось начислить XP");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    xpInput.value = "";
    setXpStatus("XP начислены", "ok");
  } catch (error) {
    setXpStatus(error.message, "error");
  } finally {
    xpSubmitBtn.disabled = false;
  }
}

connectBtn.addEventListener("click", fetchSnapshot);
refreshBtn.addEventListener("click", fetchSnapshot);

xpSubmitBtn.addEventListener("click", () => {
  grantXp(Number(xpInput.value));
});

xpInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    grantXp(Number(xpInput.value));
  }
});

document.querySelectorAll("[data-xp]").forEach((button) => {
  button.addEventListener("click", () => {
    const amount = Number(button.dataset.xp);
    grantXp(amount);
  });
});

const storedToken = localStorage.getItem("hostToken");
if (storedToken) {
  tokenInput.value = storedToken;
  state.token = storedToken;
}

render();
