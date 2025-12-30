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
const questTemplatesList = document.getElementById("quest-templates");
const questStatusGroups = document.getElementById("quest-status-groups");
const questCountEl = document.getElementById("quest-count");
const abilitiesGroups = document.getElementById("abilities-groups");
const abilitiesCountEl = document.getElementById("abilities-count");
const messagesList = document.getElementById("system-messages");
const messagesCountEl = document.getElementById("messages-count");
const logList = document.getElementById("event-log");
const logCountEl = document.getElementById("log-count");
const rulesBaseXpInput = document.getElementById("rules-base-xp");
const rulesGrowthRateInput = document.getElementById("rules-growth-rate");
const rulesBasePerLevelInput = document.getElementById("rules-base-per-level");
const rulesBonusEvery5Input = document.getElementById("rules-bonus-every-5");
const rulesBonusEvery10Input = document.getElementById("rules-bonus-every-10");
const rulesSaveBtn = document.getElementById("rules-save");
const rulesStatusEl = document.getElementById("rules-status");

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
  questTemplates: {},
  activeQuests: [],
  abilityCategories: {},
  abilities: {},
  systemMessages: [],
  selectedItemId: null,
  lastLevelUp: null,
  socket: null,
  messageCollapsed: {},
  playedMessageIds: new Set(),
  audioContext: null,
  eventLog: [],
  eventSeqs: new Set(),
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

function setRulesStatus(message, variant = "") {
  if (!rulesStatusEl) {
    return;
  }
  rulesStatusEl.textContent = message;
  rulesStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    rulesStatusEl.classList.add(`status--${variant}`);
  }
}

function setupTabs() {
  const tabs = Array.from(document.querySelectorAll(".tab"));
  const panels = Array.from(document.querySelectorAll(".tab-panel"));
  const activate = (tabId) => {
    tabs.forEach((tab) => {
      tab.classList.toggle("active", tab.dataset.tab === tabId);
    });
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.tabPanel !== tabId;
    });
  };
  tabs.forEach((tab) => {
    tab.addEventListener("click", () => activate(tab.dataset.tab));
  });
  activate("sheet");
}

function ensureAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }
}

function playTone(frequency, duration = 0.25, type = "sine", gainValue = 0.04) {
  if (!state.audioContext) {
    return;
  }
  const ctx = state.audioContext;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function playLevelUpEffect() {
  if (!state.audioContext) {
    return;
  }
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, index) => {
    setTimeout(() => playTone(freq, 0.18, "triangle", 0.06), index * 140);
  });
}

function playMessageSound(message) {
  if (!message || state.playedMessageIds.has(message.id)) {
    return;
  }
  ensureAudioContext();
  if (!state.audioContext) {
    return;
  }
  if (message.effect === "level_up") {
    playLevelUpEffect();
  } else {
    const sound = message.sound || message.severity || "info";
    if (sound === "alert") {
      playTone(740, 0.25, "square", 0.05);
    } else if (sound === "warning") {
      playTone(520, 0.25, "sawtooth", 0.04);
    } else {
      playTone(440, 0.18, "sine", 0.03);
    }
  }
  state.playedMessageIds.add(message.id);
}

function saveToken(token) {
  localStorage.setItem("hostToken", token);
  state.token = token;
}

function formatActor(actor) {
  if (actor === "host") {
    return "Хост";
  }
  if (actor === "player") {
    return "Игрок";
  }
  if (actor === "system") {
    return "Система";
  }
  return actor || "—";
}

function formatTimestamp(ts) {
  if (!ts) {
    return "";
  }
  const date = new Date(ts);
  if (Number.isNaN(date.getTime())) {
    return ts;
  }
  return date.toLocaleString("ru-RU");
}

function getSlotLabel(slot) {
  const found = EQUIPMENT_SLOTS.find((item) => item.key === slot);
  return found ? found.label : slot || "—";
}

function describeEvent(event) {
  const payload = event.payload || {};
  switch (event.kind) {
    case "xp.granted":
      return `Опыт +${payload.amount ?? 0} (уровень ${payload.old_level ?? "?"} → ${
        payload.new_level ?? "?"
      })`;
    case "level.up":
      return `Уровень ${payload.new_level ?? "?"} (+${payload.stat_points_gained ?? 0} оч.)`;
    case "inventory.added": {
      const template = state.templates?.[payload.template_id];
      const name = template?.name || payload.template_id || "предмет";
      return `Добавлен предмет: ${name} ×${payload.qty ?? 1}`;
    }
    case "inventory.removed":
      return `Удалён предмет: ${payload.item_instance_id || "—"}`;
    case "equipment.equipped": {
      const template = state.templates?.[payload.template_id];
      const name = template?.name || payload.template_id || "предмет";
      return `Экипирован ${name} в слот ${getSlotLabel(payload.slot)}`;
    }
    case "equipment.unequipped":
      return `Снят предмет из слота ${getSlotLabel(payload.slot)}`;
    case "equipment.requested":
      return `Запрос экипировки: ${payload.item_instance_id || "—"} → ${getSlotLabel(
        payload.slot,
      )}`;
    case "quest.assigned": {
      const quest = state.questTemplates?.[payload.template_id];
      const title = quest?.name || payload.template_id || "квест";
      return `Назначен квест: ${title}`;
    }
    case "quest.status": {
      const quest = payload.quest;
      const title = quest?.title || quest?.name || payload.quest_id || "квест";
      return `Статус квеста: ${title} → ${payload.status || "—"}`;
    }
    case "message.sent": {
      const title = payload.message?.title || payload.title || "сообщение";
      return `Системное сообщение: ${title}`;
    }
    case "message.choice": {
      const title = payload.message?.title || "сообщение";
      return `Выбор в сообщении: ${title}`;
    }
    case "player.freeze":
      return payload.frozen ? "Игрок заморожен" : "Игрок разморожен";
    case "currency.updated":
      return `Валюта ${payload.currency_id || "—"}: ${payload.old_value ?? 0} → ${
        payload.new_value ?? 0
      }`;
    case "resource.updated":
      return `Ресурс ${payload.resource_id || "—"}: ${payload.old_current ?? 0}/${
        payload.old_maximum ?? 0
      } → ${payload.new_current ?? 0}/${payload.new_maximum ?? 0}`;
    case "reputation.updated":
      return `Репутация ${payload.reputation_id || "—"}: ${payload.old_value ?? 0} → ${
        payload.new_value ?? 0
      }`;
    case "ability.added":
      return `Добавлена способность: ${payload.ability?.name || payload.ability_id || "—"}`;
    case "ability.updated":
      return `Обновлена способность: ${payload.ability?.name || payload.ability_id || "—"}`;
    case "ability.removed":
      return `Удалена способность: ${payload.ability_id || "—"}`;
    case "chat.contact.added":
      return `Добавлен контакт: ${payload.contact?.display_name || payload.contact_id || "—"}`;
    case "chat.friend_request.sent":
      return `Отправлена заявка в друзья: ${payload.contact_id || "—"}`;
    case "chat.friend_request.accepted":
      return `Принята заявка в друзья: ${payload.contact_id || "—"}`;
    case "chat.message":
      return `Сообщение в чате: ${payload.text || "—"}`;
    default:
      return event.kind || "Событие";
  }
}

function appendLogEvents(events) {
  if (!Array.isArray(events)) {
    return;
  }
  events.forEach((event) => {
    const key = event.seq != null ? `seq:${event.seq}` : `${event.kind}:${event.ts}`;
    if (state.eventSeqs.has(key)) {
      return;
    }
    state.eventSeqs.add(key);
    state.eventLog.push(event);
  });
}

function renderLog() {
  if (!logList) {
    return;
  }
  logList.innerHTML = "";
  const events = [...state.eventLog].sort((a, b) => (b.seq ?? 0) - (a.seq ?? 0));
  if (logCountEl) {
    logCountEl.textContent = `${events.length}`;
  }
  if (events.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Событий пока нет.";
    logList.appendChild(empty);
    return;
  }
  events.forEach((event) => {
    const entry = document.createElement("div");
    entry.className = "log-entry";

    const meta = document.createElement("div");
    meta.className = "log-entry__meta";

    const kind = document.createElement("div");
    kind.className = "log-entry__kind";
    kind.textContent = event.kind || "Событие";

    const stamp = document.createElement("div");
    stamp.textContent = `${formatTimestamp(event.ts)} · ${formatActor(event.actor)}`;

    meta.appendChild(kind);
    meta.appendChild(stamp);

    const details = document.createElement("div");
    details.className = "log-entry__details";
    details.textContent = describeEvent(event);

    entry.appendChild(meta);
    entry.appendChild(details);
    logList.appendChild(entry);
  });
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

function upsertQuest(quest) {
  if (!quest) {
    return;
  }
  const existing = state.activeQuests.find((item) => item.id === quest.id);
  if (existing) {
    Object.assign(existing, quest);
  } else {
    state.activeQuests.push(quest);
  }
}

function applyQuestAssigned(payload) {
  const quest =
    payload.quest || {
      id: payload.quest_id,
      template_id: payload.template_id,
      status: "active",
      objectives: [],
      started_at: new Date().toISOString(),
      completed_at: null,
    };
  upsertQuest(quest);
}

function applyQuestStatus(payload) {
  const quest =
    payload.quest || {
      id: payload.quest_id,
      status: payload.status,
    };
  upsertQuest(quest);
}

function upsertSystemMessage(message) {
  if (!message) {
    return;
  }
  const existing = state.systemMessages.find((item) => item.id === message.id);
  if (existing) {
    Object.assign(existing, message);
  } else {
    state.systemMessages.push(message);
  }
}

function applyMessageSent(payload) {
  if (payload.message) {
    upsertSystemMessage(payload.message);
    playMessageSound(payload.message);
  }
}

function applyMessageChoice(payload) {
  if (payload.message) {
    upsertSystemMessage(payload.message);
  } else if (payload.message_id) {
    const msg = state.systemMessages.find((item) => item.id === payload.message_id);
    if (msg) {
      msg.chosen_option_id = payload.chosen_option_id || payload.option_id || null;
    }
  }
}

function applyAbilityAdded(payload) {
  if (!payload) {
    return;
  }
  const target =
    payload.scope === "library"
      ? state.abilities
      : payload.scope === "character" || payload.character_id
        ? (state.character?.abilities ?? (state.character.abilities = {}))
        : state.abilities;
  if (!target) {
    return;
  }
  if (payload.ability) {
    target[payload.ability.id] = payload.ability;
    return;
  }
  if (payload.ability_id) {
    target[payload.ability_id] = {
      id: payload.ability_id,
      name: payload.name || "Способность",
      description: payload.description || "",
      category_id: payload.category_id || "",
      active: payload.active ?? true,
      hidden: payload.hidden ?? false,
      cooldown_s: payload.cooldown_s ?? null,
      cost: payload.cost ?? null,
      source: payload.source || "event",
    };
  }
}

function applyAbilityRemoved(payload) {
  if (!payload) {
    return;
  }
  const target =
    payload.scope === "library"
      ? state.abilities
      : payload.scope === "character" || payload.character_id
        ? state.character?.abilities
        : state.abilities;
  if (!target) {
    return;
  }
  const abilityId = payload.ability_id || payload.id;
  if (abilityId) {
    delete target[abilityId];
  }
}

function applyCurrencyUpdated(payload) {
  if (!state.character || !payload) {
    return;
  }
  if (!state.character.currencies) {
    state.character.currencies = {};
  }
  if (payload.currency_id) {
    state.character.currencies[payload.currency_id] = payload.new_value ?? payload.value ?? 0;
  }
}

function applyResourceUpdated(payload) {
  if (!state.character || !payload) {
    return;
  }
  if (!state.character.resources) {
    state.character.resources = {};
  }
  if (payload.resource_id) {
    const current = payload.current ?? 0;
    const max = payload.max ?? payload.maximum ?? 0;
    state.character.resources[payload.resource_id] = [current, max];
  }
}

function applyReputationUpdated(payload) {
  if (!state.character || !payload) {
    return;
  }
  if (!state.character.reputations) {
    state.character.reputations = {};
  }
  if (payload.reputation_id) {
    state.character.reputations[payload.reputation_id] = payload.new_value ?? payload.value ?? 0;
  }
}

function applyFreeze(payload) {
  if (!state.character || !payload) {
    return;
  }
  state.character.frozen = Boolean(payload.frozen);
}

function applySettingsUpdated(payload) {
  if (!payload) {
    return;
  }
  if (!state.settings) {
    state.settings = {};
  }
  if (payload.xp_curve) {
    state.settings.xp_curve = payload.xp_curve;
  }
  if (payload.stat_rule) {
    state.settings.stat_rule = payload.stat_rule;
  }
  renderSettings();
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
    case "quest.assigned":
      applyQuestAssigned(event.payload);
      break;
    case "quest.status":
      applyQuestStatus(event.payload);
      break;
    case "message.sent":
      applyMessageSent(event.payload);
      break;
    case "message.choice":
      applyMessageChoice(event.payload);
      break;
    case "player.freeze":
      applyFreeze(event.payload);
      break;
    case "currency.updated":
      applyCurrencyUpdated(event.payload);
      break;
    case "resource.updated":
      applyResourceUpdated(event.payload);
      break;
    case "reputation.updated":
      applyReputationUpdated(event.payload);
      break;
    case "ability.added":
    case "ability.updated":
      applyAbilityAdded(event.payload);
      break;
    case "ability.removed":
      applyAbilityRemoved(event.payload);
      break;
    case "settings.updated":
      applySettingsUpdated(event.payload);
      break;
    default:
      break;
  }
}

function applyEvents(events) {
  appendLogEvents(events);
  events.forEach(applyEvent);
  render();
}

function applySnapshot(snapshot) {
  state.snapshot = snapshot;
  state.character = snapshot.character || null;
  state.classes = snapshot.classes || {};
  state.templates = snapshot.item_templates || {};
  state.questTemplates = snapshot.quest_templates || {};
  state.activeQuests = snapshot.active_quests || [];
  state.abilityCategories = snapshot.ability_categories || {};
  state.abilities = snapshot.abilities || {};
  state.systemMessages = snapshot.system_messages || [];
  state.settings = snapshot.settings || null;
  state.eventLog = [];
  state.eventSeqs = new Set();
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

async function fetchEventLog(afterSeq = 0) {
  const token = getToken();
  if (!token) {
    return;
  }
  try {
    const response = await fetch(`/api/events?after_seq=${afterSeq}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Не удалось загрузить лог");
    }
    const payload = await response.json();
    appendLogEvents(payload.events || []);
    renderLog();
  } catch (error) {
    console.error(error);
  }
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
    await fetchEventLog(0);
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

function getQuestStatusLabel(status) {
  const labels = {
    active: "Активные",
    completed: "Завершённые",
    failed: "Проваленные",
    hidden: "Скрытые",
  };
  return labels[status] || status;
}

function formatObjective(obj) {
  if (!obj) {
    return "";
  }
  if (obj.progress && obj.progress.length === 2) {
    return `${obj.text} (${obj.progress[0]}/${obj.progress[1]})`;
  }
  return obj.text || "";
}

function renderQuestTemplates() {
  if (!questTemplatesList) {
    return;
  }
  questTemplatesList.innerHTML = "";
  const templates = Object.values(state.questTemplates || {});
  if (templates.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list__item";
    empty.textContent = "Нет доступных шаблонов.";
    questTemplatesList.appendChild(empty);
    return;
  }
  const activeTemplateIds = new Set(
    (state.activeQuests || [])
      .filter((quest) => quest.status === "active")
      .map((quest) => quest.template_id),
  );
  templates
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .forEach((template) => {
      const row = document.createElement("div");
      row.className = "list__item";
      const info = document.createElement("div");
      info.innerHTML = `<strong>${template.name}</strong><div class="meta">${template.description || "Описание отсутствует."}</div>`;
      const button = document.createElement("button");
      button.className = "ghost";
      button.textContent = activeTemplateIds.has(template.id)
        ? "Уже назначен"
        : "Назначить";
      button.disabled = activeTemplateIds.has(template.id);
      button.addEventListener("click", () => assignQuest(template.id, button));
      row.appendChild(info);
      row.appendChild(button);
      questTemplatesList.appendChild(row);
    });
}

function renderQuestGroups() {
  if (!questStatusGroups) {
    return;
  }
  questStatusGroups.innerHTML = "";
  const quests = state.activeQuests || [];
  const grouped = quests.reduce((acc, quest) => {
    const status = quest.status || "active";
    if (!acc[status]) {
      acc[status] = [];
    }
    acc[status].push(quest);
    return acc;
  }, {});
  const statuses = ["active", "completed", "failed", "hidden"];
  statuses.forEach((status) => {
    const group = document.createElement("div");
    group.className = "quest-group";
    const title = document.createElement("div");
    title.className = "quest-card__title";
    title.textContent = getQuestStatusLabel(status);
    group.appendChild(title);

    const items = grouped[status] || [];
    if (items.length === 0) {
      const empty = document.createElement("div");
      empty.className = "meta";
      empty.textContent = "Пусто";
      group.appendChild(empty);
    } else {
      items.forEach((quest) => {
        const template = state.questTemplates?.[quest.template_id];
        const card = document.createElement("div");
        card.className = "quest-card";

        const header = document.createElement("div");
        header.className = "quest-card__header";
        const titleEl = document.createElement("div");
        titleEl.className = "quest-card__title";
        titleEl.textContent = template?.name || `Квест ${quest.id}`;
        header.appendChild(titleEl);

        const statusSelect = document.createElement("select");
        ["active", "completed", "failed", "hidden"].forEach((opt) => {
          const option = document.createElement("option");
          option.value = opt;
          option.textContent = getQuestStatusLabel(opt);
          if (quest.status === opt) {
            option.selected = true;
          }
          statusSelect.appendChild(option);
        });
        statusSelect.addEventListener("change", () =>
          updateQuestStatus(quest.id, statusSelect.value, statusSelect),
        );
        header.appendChild(statusSelect);

        const meta = document.createElement("div");
        meta.className = "quest-meta";
        meta.textContent = template?.description || "Описание отсутствует.";

        const objectives = document.createElement("div");
        objectives.className = "quest-objectives";
        (quest.objectives || []).forEach((obj) => {
          const row = document.createElement("div");
          row.className = "quest-objective";
          if (obj.done) {
            row.classList.add("done");
          }
          row.textContent = formatObjective(obj);
          objectives.appendChild(row);
        });

        card.appendChild(header);
        card.appendChild(meta);
        if ((quest.objectives || []).length) {
          card.appendChild(objectives);
        }
        group.appendChild(card);
      });
    }

    questStatusGroups.appendChild(group);
  });
}

function collectAbilities() {
  return {
    ...(state.abilities || {}),
    ...(state.character?.abilities || {}),
  };
}

function renderAbilities() {
  if (!abilitiesGroups) {
    return;
  }
  abilitiesGroups.innerHTML = "";
  const abilities = Object.values(collectAbilities());
  abilitiesCountEl.textContent = `${abilities.length}`;
  if (abilities.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Нет доступных способностей.";
    abilitiesGroups.appendChild(empty);
    return;
  }
  const grouped = abilities.reduce((acc, ability) => {
    const categoryId = ability.category_id || "uncategorized";
    if (!acc[categoryId]) {
      acc[categoryId] = [];
    }
    acc[categoryId].push(ability);
    return acc;
  }, {});
  const categories = Object.keys(grouped).sort((a, b) => {
    const nameA = state.abilityCategories?.[a]?.name || "Без категории";
    const nameB = state.abilityCategories?.[b]?.name || "Без категории";
    return nameA.localeCompare(nameB, "ru");
  });
  categories.forEach((categoryId) => {
    const group = document.createElement("div");
    group.className = "ability-group";
    const title = document.createElement("div");
    title.className = "quest-card__title";
    title.textContent = state.abilityCategories?.[categoryId]?.name || "Без категории";
    group.appendChild(title);

    grouped[categoryId]
      .sort((a, b) => a.name.localeCompare(b.name, "ru"))
      .forEach((ability) => {
        const card = document.createElement("div");
        card.className = "ability-card";

        const header = document.createElement("div");
        header.className = "ability-card__header";
        const name = document.createElement("div");
        name.className = "ability-card__title";
        name.textContent = ability.name || "Без названия";
        header.appendChild(name);

        const status = document.createElement("span");
        status.className = "tag";
        status.textContent = ability.active ? "Активна" : "Пассивна";
        header.appendChild(status);

        const meta = document.createElement("div");
        meta.className = "ability-meta";
        const info = [];
        if (ability.cooldown_s) {
          info.push(`КД: ${ability.cooldown_s}s`);
        }
        if (ability.cost) {
          info.push(`Стоимость: ${ability.cost}`);
        }
        if (ability.source) {
          info.push(`Источник: ${ability.source}`);
        }
        meta.textContent = info.join(" · ");

        const description = document.createElement("div");
        description.className = "message-card__body";
        description.textContent = ability.description || "Описание отсутствует.";

        card.appendChild(header);
        if (meta.textContent) {
          card.appendChild(meta);
        }
        card.appendChild(description);
        group.appendChild(card);
      });
    abilitiesGroups.appendChild(group);
  });
}

function isMessageCollapsed(message) {
  if (!message.collapsible) {
    return false;
  }
  if (message.choices?.length && message.chosen_option_id) {
    return state.messageCollapsed[message.id] ?? true;
  }
  return state.messageCollapsed[message.id] ?? false;
}

function renderMessages() {
  if (!messagesList) {
    return;
  }
  messagesList.innerHTML = "";
  const messages = [...(state.systemMessages || [])].sort((a, b) =>
    (b.created_at || "").localeCompare(a.created_at || ""),
  );
  messagesCountEl.textContent = `${messages.length}`;
  if (messages.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Сообщений пока нет.";
    messagesList.appendChild(empty);
    return;
  }
  messages.forEach((message) => {
    const card = document.createElement("div");
    card.className = `message-card message-card--${message.severity || "info"}`;

    const header = document.createElement("div");
    header.className = "message-card__header";
    const title = document.createElement("div");
    title.className = "message-card__title";
    title.textContent = message.title || "Сообщение";
    header.appendChild(title);

    const actions = document.createElement("div");
    actions.className = "message-card__actions";
    if (message.collapsible) {
      const toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "ghost";
      toggle.textContent = isMessageCollapsed(message) ? "Развернуть" : "Свернуть";
      toggle.addEventListener("click", () => {
        state.messageCollapsed[message.id] = !isMessageCollapsed(message);
        renderMessages();
      });
      actions.appendChild(toggle);
    }
    header.appendChild(actions);

    card.appendChild(header);

    const summary = document.createElement("div");
    summary.className = "message-card__summary";
    const chosenOption = message.choices?.find(
      (choice) => choice.id === message.chosen_option_id,
    );
    if (chosenOption) {
      summary.textContent = `Выбрано: ${chosenOption.label}`;
    }

    const body = document.createElement("div");
    body.className = "message-card__body";
    body.textContent = message.body || "";

    if (!isMessageCollapsed(message)) {
      card.appendChild(body);
      if (message.choices?.length) {
        const choices = document.createElement("div");
        choices.className = "message-card__choices";
        message.choices.forEach((choice) => {
          const button = document.createElement("button");
          button.type = "button";
          button.className = "ghost";
          button.textContent = choice.label;
          button.disabled = true;
          choices.appendChild(button);
        });
        card.appendChild(choices);
      }
      if (summary.textContent) {
        card.appendChild(summary);
      }
    } else if (summary.textContent) {
      card.appendChild(summary);
    }

    messagesList.appendChild(card);
  });
}

function renderSettings() {
  if (!state.settings) {
    return;
  }
  if (rulesBaseXpInput) {
    rulesBaseXpInput.value = state.settings.xp_curve?.base_xp ?? "";
  }
  if (rulesGrowthRateInput) {
    rulesGrowthRateInput.value = state.settings.xp_curve?.growth_rate ?? "";
  }
  if (rulesBasePerLevelInput) {
    rulesBasePerLevelInput.value = state.settings.stat_rule?.base_per_level ?? "";
  }
  if (rulesBonusEvery5Input) {
    rulesBonusEvery5Input.value = state.settings.stat_rule?.bonus_every_5 ?? "";
  }
  if (rulesBonusEvery10Input) {
    rulesBonusEvery10Input.value = state.settings.stat_rule?.bonus_every_10 ?? "";
  }
}

function render() {
  if (!state.character) {
    return;
  }
  renderSheet();
  renderInventory();
  renderItemCard();
  renderEquipment();
  renderQuestTemplates();
  renderQuestGroups();
  renderAbilities();
  renderMessages();
  renderLog();
  renderSettings();
  if (questCountEl) {
    questCountEl.textContent = `${state.activeQuests?.length || 0}`;
  }
}

async function assignQuest(templateId, button) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  if (button) {
    button.disabled = true;
  }
  try {
    const response = await fetch("/api/host/quests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ template_id: templateId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось назначить квест");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setStatus("Квест назначен", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function updateQuestStatus(questId, status, element) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  if (element) {
    element.disabled = true;
  }
  try {
    const response = await fetch(`/api/host/quests/${questId}/status`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось обновить статус");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setStatus("Статус квеста обновлён", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    if (element) {
      element.disabled = false;
    }
  }
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

async function updateRulesSettings() {
  const token = getToken();
  if (!token) {
    setRulesStatus("Укажите токен", "error");
    return;
  }
  const baseXp = Number(rulesBaseXpInput?.value);
  const growthRate = Number(rulesGrowthRateInput?.value);
  const basePerLevel = Number(rulesBasePerLevelInput?.value);
  const bonusEvery5 = Number(rulesBonusEvery5Input?.value);
  const bonusEvery10 = Number(rulesBonusEvery10Input?.value);
  if (!baseXp || baseXp <= 0 || !growthRate || growthRate <= 0) {
    setRulesStatus("Проверьте значения XP", "error");
    return;
  }
  rulesSaveBtn.disabled = true;
  setRulesStatus("Сохранение...");
  try {
    const response = await fetch("/api/host/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        xp_curve: { base_xp: baseXp, growth_rate: growthRate },
        stat_rule: {
          base_per_level: basePerLevel,
          bonus_every_5: bonusEvery5,
          bonus_every_10: bonusEvery10,
        },
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось сохранить правила");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setRulesStatus("Правила обновлены", "ok");
  } catch (error) {
    setRulesStatus(error.message, "error");
  } finally {
    rulesSaveBtn.disabled = false;
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

if (rulesSaveBtn) {
  rulesSaveBtn.addEventListener("click", updateRulesSettings);
}

const storedToken = localStorage.getItem("hostToken");
if (storedToken) {
  tokenInput.value = storedToken;
  state.token = storedToken;
}

document.addEventListener(
  "click",
  () => {
    ensureAudioContext();
  },
  { once: true },
);

setupTabs();
render();
