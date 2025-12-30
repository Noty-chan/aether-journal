const tokenInput = document.getElementById("token-input");
const connectBtn = document.getElementById("connect-btn");
const refreshBtn = document.getElementById("refresh-btn");
const statusEl = document.getElementById("status");
const requestsList = document.getElementById("requests-list");
const contactsCount = document.getElementById("contacts-count");
const chatsCount = document.getElementById("chats-count");
const characterNameEl = document.getElementById("character-name");
const characterClassEl = document.getElementById("character-class");
const characterLevelEl = document.getElementById("character-level");
const xpCurrentEl = document.getElementById("xp-current");
const xpNextEl = document.getElementById("xp-next");
const xpFillEl = document.getElementById("xp-fill");
const freezeStatusEl = document.getElementById("freeze-status");
const statsStatusEl = document.getElementById("stats-status");
const sheetSectionsContainer = document.getElementById("sheet-sections");
const inventoryList = document.getElementById("inventory-list");
const inventoryCountEl = document.getElementById("inventory-count");
const itemCard = document.getElementById("item-card");
const equipmentGrid = document.getElementById("equipment-grid");
const questStatusGroups = document.getElementById("quest-status-groups");
const questCountEl = document.getElementById("quest-count");
const abilitiesGroups = document.getElementById("abilities-groups");
const abilitiesCountEl = document.getElementById("abilities-count");
const messagesList = document.getElementById("system-messages");
const messagesCountEl = document.getElementById("messages-count");
const logList = document.getElementById("event-log");
const logCountEl = document.getElementById("log-count");
const questSearchInput = document.getElementById("quest-search");
const chatSummaryEl = document.getElementById("chat-summary");
const chatThreadsList = document.getElementById("chat-threads-list");
const chatActiveTitle = document.getElementById("chat-active-title");
const chatMessagesList = document.getElementById("chat-messages");
const chatMessageText = document.getElementById("chat-message-text");
const chatMessageSendBtn = document.getElementById("chat-message-send");
const chatMessageStatusEl = document.getElementById("chat-message-status");
const chatLinkTypeSelect = document.getElementById("chat-link-type");
const chatLinkEntitySelect = document.getElementById("chat-link-entity");
const chatLinkAddBtn = document.getElementById("chat-link-add");
const chatLinksList = document.getElementById("chat-links-list");
const soundMasterInput = document.getElementById("sound-master");
const soundInfoInput = document.getElementById("sound-info");
const soundWarningInput = document.getElementById("sound-warning");
const soundAlertInput = document.getElementById("sound-alert");
const soundLevelUpInput = document.getElementById("sound-level-up");
const soundMasterValue = document.getElementById("sound-master-value");
const soundInfoValue = document.getElementById("sound-info-value");
const soundWarningValue = document.getElementById("sound-warning-value");
const soundAlertValue = document.getElementById("sound-alert-value");
const soundLevelUpValue = document.getElementById("sound-level-up-value");

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

const SHEET_SECTION_INFO = {
  stats: { label: "Статы", empty: "Нет статов" },
  resources: { label: "Ресурсы", empty: "Нет ресурсов" },
  currencies: { label: "Валюты", empty: "Нет валют" },
  reputations: { label: "Репутации", empty: "Нет репутаций" },
};

const DEFAULT_SHEET_SECTIONS = [
  { key: "stats", title: "Статы", visible: true, order: 1 },
  { key: "resources", title: "Ресурсы", visible: true, order: 2 },
  { key: "currencies", title: "Валюты", visible: true, order: 3 },
  { key: "reputations", title: "Репутации", visible: true, order: 4 },
];

const DEFAULT_AUDIO_SETTINGS = {
  master: 1,
  info: 0.8,
  warning: 0.9,
  alert: 1,
  level_up: 1,
};

const AUDIO_SETTINGS_KEY = "playerAudioSettings";

const state = {
  contacts: {},
  chats: {},
  friendRequests: {},
  token: "",
  snapshot: null,
  settings: null,
  character: null,
  classes: {},
  templates: {},
  messageTemplates: {},
  questTemplates: {},
  questQuery: "",
  activeQuests: [],
  abilityCategories: {},
  abilities: {},
  systemMessages: [],
  selectedItemId: null,
  socket: null,
  messageCollapsed: {},
  playedMessageIds: new Set(),
  audioContext: null,
  audioSettings: { ...DEFAULT_AUDIO_SETTINGS },
  eventLog: [],
  eventSeqs: new Set(),
  sheetSectionsKey: "",
  sheetSectionNodes: {},
  linkables: { npcs: [], quests: [], items: [] },
  selectedChatId: null,
  pendingChatLinks: [],
};

function setStatus(message, variant = "") {
  statusEl.textContent = message;
  statusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    statusEl.classList.add(`status--${variant}`);
  }
}

function setStatsStatus(message, variant = "") {
  if (!statsStatusEl) {
    return;
  }
  statsStatusEl.textContent = message;
  statsStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    statsStatusEl.classList.add(`status--${variant}`);
  }
}

function setChatMessageStatus(message, variant = "") {
  if (!chatMessageStatusEl) {
    return;
  }
  chatMessageStatusEl.textContent = message;
  chatMessageStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    chatMessageStatusEl.classList.add(`status--${variant}`);
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

function clampVolume(value, fallback) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return fallback;
  }
  return Math.min(1, Math.max(0, value));
}

function loadAudioSettings() {
  const raw = localStorage.getItem(AUDIO_SETTINGS_KEY);
  if (!raw) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
  try {
    const parsed = JSON.parse(raw);
    return {
      master: clampVolume(parsed.master, DEFAULT_AUDIO_SETTINGS.master),
      info: clampVolume(parsed.info, DEFAULT_AUDIO_SETTINGS.info),
      warning: clampVolume(parsed.warning, DEFAULT_AUDIO_SETTINGS.warning),
      alert: clampVolume(parsed.alert, DEFAULT_AUDIO_SETTINGS.alert),
      level_up: clampVolume(parsed.level_up, DEFAULT_AUDIO_SETTINGS.level_up),
    };
  } catch (error) {
    return { ...DEFAULT_AUDIO_SETTINGS };
  }
}

function saveAudioSettings() {
  localStorage.setItem(AUDIO_SETTINGS_KEY, JSON.stringify(state.audioSettings));
}

function updateAudioValue(input, valueEl, value) {
  if (!input || !valueEl) {
    return;
  }
  const percent = Math.round(value * 100);
  input.value = `${percent}`;
  valueEl.textContent = `${percent}%`;
}

function syncAudioControls() {
  updateAudioValue(soundMasterInput, soundMasterValue, state.audioSettings.master);
  updateAudioValue(soundInfoInput, soundInfoValue, state.audioSettings.info);
  updateAudioValue(soundWarningInput, soundWarningValue, state.audioSettings.warning);
  updateAudioValue(soundAlertInput, soundAlertValue, state.audioSettings.alert);
  updateAudioValue(soundLevelUpInput, soundLevelUpValue, state.audioSettings.level_up);
}

function bindAudioControl(input, key) {
  if (!input) {
    return;
  }
  input.addEventListener("input", () => {
    const value = clampVolume(Number(input.value) / 100, state.audioSettings[key]);
    state.audioSettings[key] = value;
    syncAudioControls();
    saveAudioSettings();
  });
}

function ensureAudioContext() {
  if (!state.audioContext) {
    state.audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  if (state.audioContext.state === "suspended") {
    state.audioContext.resume();
  }
}

function getContactLabel(contactId) {
  if (!contactId) {
    return "—";
  }
  return state.contacts?.[contactId]?.display_name || contactId;
}

function formatChatTimestamp(timestamp) {
  if (!timestamp) {
    return "";
  }
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  return date.toLocaleString("ru", {
    hour: "2-digit",
    minute: "2-digit",
    day: "2-digit",
    month: "2-digit",
  });
}

function ensureChatThread(chatId) {
  if (!state.chats[chatId]) {
    state.chats[chatId] = {
      id: chatId,
      contact_id: "",
      opened: false,
      messages: [],
    };
  }
  if (!state.chats[chatId].messages) {
    state.chats[chatId].messages = [];
  }
  return state.chats[chatId];
}

function playTone(
  frequency,
  duration = 0.25,
  type = "sine",
  gainValue = 0.04,
  volume = 1,
) {
  if (!state.audioContext) {
    return;
  }
  const ctx = state.audioContext;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.value = gainValue * volume;
  oscillator.connect(gain);
  gain.connect(ctx.destination);
  oscillator.start();
  oscillator.stop(ctx.currentTime + duration);
}

function playLevelUpEffect(volume = 1) {
  if (!state.audioContext) {
    return;
  }
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, index) => {
    setTimeout(() => playTone(freq, 0.18, "triangle", 0.06, volume), index * 140);
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
  const masterVolume = state.audioSettings.master ?? 1;
  if (message.effect === "level_up") {
    const levelVolume = (state.audioSettings.level_up ?? 1) * masterVolume;
    if (levelVolume > 0) {
      playLevelUpEffect(levelVolume);
    }
  } else {
    const sound = message.sound || message.severity || "info";
    const categoryVolume =
      sound === "alert"
        ? state.audioSettings.alert ?? 1
        : sound === "warning"
          ? state.audioSettings.warning ?? 1
          : state.audioSettings.info ?? 1;
    const volume = categoryVolume * masterVolume;
    if (volume <= 0) {
      state.playedMessageIds.add(message.id);
      return;
    }
    if (sound === "alert") {
      playTone(740, 0.25, "square", 0.05, volume);
    } else if (sound === "warning") {
      playTone(520, 0.25, "sawtooth", 0.04, volume);
    } else {
      playTone(440, 0.18, "sine", 0.03, volume);
    }
  }
  state.playedMessageIds.add(message.id);
}

function saveToken(token) {
  localStorage.setItem("playerToken", token);
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
    case "stat.allocated":
      return `Распределены очки: ${payload.stat_id || "—"} +${payload.amount ?? 0}`;
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
  const newLevel = Number(payload.new_level ?? state.character.level ?? 0);
  if (!Number.isNaN(newLevel) && newLevel > Number(state.character.level ?? 0)) {
    state.character.level = newLevel;
  }
  const classDef = state.classes?.[state.character.class_id];
  const bonus = classDef?.per_level_bonus ?? {};
  Object.entries(bonus).forEach(([stat, delta]) => {
    const current = Number(state.character.stats?.[stat] ?? 0);
    state.character.stats[stat] = current + Number(delta);
  });
}

function applyStatAllocated(payload) {
  if (!state.character) {
    return;
  }
  const statId = payload.stat_id;
  if (!statId) {
    return;
  }
  if (!state.character.stats) {
    state.character.stats = {};
  }
  state.character.stats[statId] = Number(payload.new_value ?? payload.value ?? 0);
  state.character.unspent_stat_points = Number(payload.remaining_points ?? 0);
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
  if (payload.sheet_sections) {
    state.settings.sheet_sections = payload.sheet_sections;
    state.sheetSectionsKey = "";
  }
}

function applyClassBonusUpdated(payload) {
  if (!payload?.class_id) {
    return;
  }
  if (!state.classes[payload.class_id]) {
    return;
  }
  state.classes[payload.class_id].per_level_bonus = payload.per_level_bonus || {};
}

function applyItemTemplateUpserted(payload) {
  const template = payload?.template;
  if (!template || !template.id) {
    return;
  }
  state.templates[template.id] = template;
}

function applyMessageTemplateUpserted(payload) {
  const template = payload?.template;
  if (!template || !template.id) {
    return;
  }
  state.messageTemplates[template.id] = template;
}

function ensureContact(contactId) {
  if (!state.contacts[contactId]) {
    state.contacts[contactId] = {
      id: contactId,
      display_name: "Неизвестный контакт",
      link_payload: {},
    };
  }
}

function applyChatContactAdded(payload) {
  const contactId = payload?.contact_id;
  if (!contactId) {
    return;
  }
  const displayName = payload.display_name || payload.contact?.display_name || contactId;
  state.contacts[contactId] = {
    id: contactId,
    display_name: displayName,
    link_payload: payload.link_payload || payload.contact?.link_payload || {},
  };
  if (!state.linkables.npcs.some((npc) => npc.id === contactId)) {
    state.linkables.npcs.push({ type: "npc", id: contactId, label: displayName });
  }
}

function applyChatFriendRequestSent(payload, eventTs) {
  const requestId = payload?.request_id;
  const contactId = payload?.contact_id;
  if (!requestId || !contactId) {
    return;
  }
  ensureContact(contactId);
  state.friendRequests[requestId] = {
    id: requestId,
    contact_id: contactId,
    created_at: payload.created_at || eventTs || new Date().toISOString(),
    accepted: false,
    accepted_at: null,
  };
}

function applyChatFriendRequestAccepted(payload, eventTs) {
  const requestId = payload?.request_id;
  const contactId = payload?.contact_id;
  const chatId = payload?.chat_id;
  if (requestId && state.friendRequests[requestId]) {
    state.friendRequests[requestId].accepted = true;
    state.friendRequests[requestId].accepted_at = payload.accepted_at || eventTs;
  }
  if (chatId) {
    const chat = ensureChatThread(chatId);
    chat.contact_id = contactId || chat.contact_id;
    chat.opened = true;
  }
}

function applyChatMessage(event) {
  const payload = event.payload || {};
  const chatId = payload.chat_id;
  if (!chatId) {
    return;
  }
  const chat = ensureChatThread(chatId);
  const messageId = payload.message_id || `${chatId}-${event.ts || Date.now()}`;
  if (chat.messages?.some((message) => message.id === messageId)) {
    return;
  }
  chat.messages.push({
    id: messageId,
    chat_id: chatId,
    sender_contact_id: payload.sender_contact_id || "",
    text: payload.text || "",
    created_at: event.ts || new Date().toISOString(),
    links: payload.links || [],
  });
}

function applyEvent(event) {
  switch (event.kind) {
    case "chat.contact.added":
      applyChatContactAdded(event.payload);
      break;
    case "chat.friend_request.sent":
      applyChatFriendRequestSent(event.payload, event.ts);
      break;
    case "chat.friend_request.accepted":
      applyChatFriendRequestAccepted(event.payload, event.ts);
      break;
    case "chat.message":
      applyChatMessage(event);
      break;
    case "xp.granted":
      applyXpGranted(Number(event.payload.amount ?? 0));
      break;
    case "level.up":
      applyLevelUpEvent(event.payload);
      break;
    case "stat.allocated":
      applyStatAllocated(event.payload);
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
    case "class.per_level_bonus.updated":
      applyClassBonusUpdated(event.payload);
      break;
    case "item.template.upserted":
      applyItemTemplateUpserted(event.payload);
      break;
    case "message.template.upserted":
      applyMessageTemplateUpserted(event.payload);
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
  state.messageTemplates = snapshot.message_templates || {};
  state.activeQuests = snapshot.active_quests || [];
  state.abilityCategories = snapshot.ability_categories || {};
  state.abilities = snapshot.abilities || {};
  state.systemMessages = snapshot.system_messages || [];
  state.settings = snapshot.settings || null;
  state.contacts = snapshot.contacts || {};
  state.chats = snapshot.chats || {};
  state.friendRequests = snapshot.friend_requests || {};
  state.selectedChatId = null;
  state.pendingChatLinks = [];
  state.eventLog = [];
  state.eventSeqs = new Set();
  state.sheetSectionsKey = "";
  state.sheetSectionNodes = {};
  if (!state.character?.equipment) {
    state.character.equipment = {};
  }
  if (!state.character?.inventory) {
    state.character.inventory = {};
  }
  Object.values(state.chats || {}).forEach((chat) => {
    if (!chat.messages) {
      chat.messages = [];
    }
  });
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
  setStatus("Подключение…");
  try {
    const response = await fetch("/api/snapshot", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error("Не удалось загрузить snapshot");
    }
    const payload = await response.json();
    applySnapshot(payload.snapshot || {});
    saveToken(token);
    await fetchLinkables();
    await fetchEventLog(0);
    connectEventStream(token, payload.last_seq ?? 0);
  } catch (error) {
    setStatus(error.message, "error");
  }
}

async function fetchLinkables() {
  const token = getToken();
  if (!token) {
    return;
  }
  try {
    const response = await fetch("/api/player/linkables", {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Не удалось загрузить linkables");
    }
    state.linkables = (await response.json()) || { npcs: [], quests: [], items: [] };
  } catch (error) {
    console.error(error);
  }
  renderChatLinkables();
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

function renderStatsList(container, items, options) {
  const { emptyMessage, unspent, frozen } = options;
  container.innerHTML = "";
  if (!items || items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list__item";
    empty.textContent = emptyMessage;
    container.appendChild(empty);
  }
  items.forEach(({ label, value }) => {
    const row = document.createElement("div");
    row.className = "list__item list__item--stat";
    const name = document.createElement("span");
    name.textContent = label;
    const val = document.createElement("span");
    val.textContent = value;
    const actions = document.createElement("div");
    actions.className = "list__item-actions";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = "+1";
    button.disabled = frozen || unspent <= 0;
    button.addEventListener("click", () => allocateStatPoints(label, 1));
    actions.appendChild(button);
    row.appendChild(name);
    row.appendChild(val);
    row.appendChild(actions);
    container.appendChild(row);
  });

  const unspentRow = document.createElement("div");
  unspentRow.className = "list__item list__item--summary";
  const unspentLabel = document.createElement("span");
  unspentLabel.textContent = "Нераспр. очки";
  const unspentValue = document.createElement("span");
  unspentValue.textContent = unspent ?? 0;
  unspentRow.appendChild(unspentLabel);
  unspentRow.appendChild(unspentValue);
  container.appendChild(unspentRow);
}

function getSheetSectionsConfig() {
  const configured = state.settings?.sheet_sections;
  if (Array.isArray(configured) && configured.length > 0) {
    return configured.map((section, index) => ({
      key: section.key,
      title: section.title || SHEET_SECTION_INFO[section.key]?.label || section.key,
      visible: section.visible ?? true,
      order: Number.isFinite(section.order) ? section.order : index + 1,
    }));
  }
  return DEFAULT_SHEET_SECTIONS.map((section) => ({ ...section }));
}

function renderSheetSections() {
  if (!sheetSectionsContainer) {
    return;
  }
  const sections = getSheetSectionsConfig()
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const key = JSON.stringify(sections);
  if (state.sheetSectionsKey === key && Object.keys(state.sheetSectionNodes).length) {
    return;
  }
  sheetSectionsContainer.innerHTML = "";
  state.sheetSectionNodes = {};
  sections.forEach((section) => {
    if (!section.visible) {
      return;
    }
    const wrapper = document.createElement("div");
    wrapper.className = "sheet__section";
    const title = document.createElement("h3");
    title.textContent = section.title || section.key;
    const list = document.createElement("div");
    list.className = "list";
    wrapper.appendChild(title);
    wrapper.appendChild(list);
    sheetSectionsContainer.appendChild(wrapper);
    state.sheetSectionNodes[section.key] = {
      list,
      empty:
        SHEET_SECTION_INFO[section.key]?.empty ||
        `Нет данных: ${section.title || section.key}`,
    };
  });
  state.sheetSectionsKey = key;
}

function renderSheet() {
  if (!state.character) {
    return;
  }
  renderSheetSections();
  const classDef = state.classes?.[state.character.class_id];
  characterNameEl.textContent = state.character.name || "Без имени";
  characterClassEl.textContent = classDef
    ? `Класс: ${classDef.name}`
    : "Класс —";
  characterLevelEl.textContent = state.character.level ?? 1;
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
  if (state.character.frozen) {
    freezeStatusEl.textContent = "Действия заблокированы хостом.";
  } else {
    freezeStatusEl.textContent = "";
  }

  const stats = Object.entries(state.character.stats || {}).map(([key, value]) => ({
    label: key,
    value,
  }));

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

  if (state.sheetSectionNodes.stats) {
    renderStatsList(state.sheetSectionNodes.stats.list, stats, {
      emptyMessage: state.sheetSectionNodes.stats.empty,
      unspent: state.character.unspent_stat_points ?? 0,
      frozen: Boolean(state.character.frozen),
    });
  }
  if (state.sheetSectionNodes.resources) {
    renderList(
      state.sheetSectionNodes.resources.list,
      resources,
      state.sheetSectionNodes.resources.empty,
    );
  }
  if (state.sheetSectionNodes.currencies) {
    renderList(
      state.sheetSectionNodes.currencies.list,
      currencies,
      state.sheetSectionNodes.currencies.empty,
    );
  }
  if (state.sheetSectionNodes.reputations) {
    renderList(
      state.sheetSectionNodes.reputations.list,
      reputations,
      state.sheetSectionNodes.reputations.empty,
    );
  }
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
    const select = document.createElement("select");
    slots.forEach((slot) => {
      const option = document.createElement("option");
      option.value = slot;
      option.textContent = slot;
      select.appendChild(option);
    });
    actions.appendChild(select);

    const button = document.createElement("button");
    button.type = "button";
    button.textContent = "Запросить экипировку";
    button.addEventListener("click", () =>
      requestEquip(item.id, select.value, button),
    );
    if (state.character?.frozen) {
      button.disabled = true;
    }
    actions.appendChild(button);
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
  EQUIPMENT_SLOTS.forEach(({ key, label }) => {
    const slotEl = document.createElement("div");
    slotEl.className = "slot";

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

function normalizeSearch(value) {
  return (value || "").toString().trim().toLowerCase();
}

function questMatchesFilter(quest, template, query) {
  const normalized = normalizeSearch(query);
  if (!normalized) {
    return true;
  }
  const objectives = (quest.objectives || [])
    .map((obj) => obj.text)
    .filter(Boolean)
    .join(" ");
  const haystack = normalizeSearch(
    [template?.name, template?.description, objectives].join(" "),
  );
  return haystack.includes(normalized);
}

function renderQuestGroups() {
  if (!questStatusGroups) {
    return;
  }
  questStatusGroups.innerHTML = "";
  const quests = state.activeQuests || [];
  const filtered = quests.filter((quest) =>
    questMatchesFilter(quest, state.questTemplates?.[quest.template_id], state.questQuery),
  );
  if (questCountEl) {
    questCountEl.textContent = state.questQuery
      ? `${filtered.length} / ${quests.length}`
      : `${quests.length}`;
  }
  const grouped = filtered.reduce((acc, quest) => {
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

        const statusTag = document.createElement("span");
        statusTag.className = "tag";
        statusTag.textContent = getQuestStatusLabel(quest.status || "active");
        header.appendChild(statusTag);

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
          button.disabled = Boolean(message.chosen_option_id) || state.character?.frozen;
          button.addEventListener("click", () =>
            chooseMessageOption(message.id, choice.id, button),
          );
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

function renderChatLinkables() {
  if (!chatLinkTypeSelect || !chatLinkEntitySelect) {
    return;
  }
  const type = chatLinkTypeSelect.value;
  const catalog =
    type === "npc"
      ? state.linkables.npcs
      : type === "quest"
        ? state.linkables.quests
        : state.linkables.items;
  chatLinkEntitySelect.innerHTML = "";
  if (!catalog?.length) {
    const option = document.createElement("option");
    option.value = "";
    option.textContent = "Нет доступных сущностей";
    chatLinkEntitySelect.appendChild(option);
    return;
  }
  catalog.forEach((item) => {
    const option = document.createElement("option");
    option.value = item.id;
    option.textContent = item.label || item.id;
    chatLinkEntitySelect.appendChild(option);
  });
}

function renderPendingChatLinks() {
  if (!chatLinksList) {
    return;
  }
  chatLinksList.innerHTML = "";
  if (!state.pendingChatLinks.length) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = "Ссылок нет.";
    chatLinksList.appendChild(empty);
    return;
  }
  state.pendingChatLinks.forEach((link, index) => {
    const item = document.createElement("div");
    item.className = "chat-links__item";
    item.textContent = `${link.label} (${link.type})`;
    const button = document.createElement("button");
    button.type = "button";
    button.className = "ghost";
    button.textContent = "Удалить";
    button.addEventListener("click", () => {
      state.pendingChatLinks.splice(index, 1);
      renderPendingChatLinks();
    });
    item.appendChild(button);
    chatLinksList.appendChild(item);
  });
}

function renderChatThreads() {
  if (!chatThreadsList) {
    return;
  }
  chatThreadsList.innerHTML = "";
  const chats = Object.values(state.chats || {});
  if (!chats.length) {
    const empty = document.createElement("div");
    empty.className = "list__item";
    empty.textContent = "Чатов пока нет.";
    chatThreadsList.appendChild(empty);
    return;
  }
  chats
    .sort((a, b) => {
      const nameA = getContactLabel(a.contact_id);
      const nameB = getContactLabel(b.contact_id);
      return nameA.localeCompare(nameB, "ru");
    })
    .forEach((chat) => {
      const row = document.createElement("div");
      row.className = "chat-thread";
      if (chat.id === state.selectedChatId) {
        row.classList.add("active");
      }
      const meta = document.createElement("div");
      meta.className = "chat-thread__meta";
      const title = document.createElement("div");
      title.className = "chat-thread__title";
      title.textContent = getContactLabel(chat.contact_id);
      const status = document.createElement("div");
      status.className = "chat-thread__status";
      status.textContent = chat.opened ? "Открыт" : "Ожидает принятия";
      meta.appendChild(title);
      meta.appendChild(status);
      row.appendChild(meta);
      row.addEventListener("click", () => {
        state.selectedChatId = chat.id;
        state.pendingChatLinks = [];
        renderChat();
      });
      chatThreadsList.appendChild(row);
    });
}

function formatLinkType(kind, payload = {}) {
  if (kind === "npc") {
    const type = payload.type || payload.role || payload.profile_type || "npc";
    return type === "player" ? "Игрок" : "NPC";
  }
  if (kind === "quest") {
    return "Квест";
  }
  if (kind === "item") {
    return "Предмет";
  }
  return kind || "Ссылка";
}

function formatStatMods(statMods) {
  if (!statMods || typeof statMods !== "object") {
    return "";
  }
  const entries = Object.entries(statMods)
    .filter(([, value]) => Number(value))
    .map(([key, value]) => `${key}: ${value > 0 ? "+" : ""}${value}`);
  return entries.join(", ");
}

function buildChatLinkCard(link) {
  const payload = link.payload || {};
  const kind = link.kind || link.type || "";
  const card = document.createElement("div");
  card.className = "chat-link-card";

  const header = document.createElement("div");
  header.className = "chat-link-card__header";
  const title = document.createElement("div");
  title.className = "chat-link-card__title";
  title.textContent = link.title || link.label || link.id || "Ссылка";
  const typeTag = document.createElement("span");
  typeTag.className = "tag";
  typeTag.textContent = formatLinkType(kind, payload);
  header.appendChild(title);
  header.appendChild(typeTag);

  const meta = document.createElement("div");
  meta.className = "chat-link-card__meta";
  const metaItems = [];
  if (kind === "npc") {
    const className = payload.class_name || payload.class || payload.class_id;
    const level = payload.level;
    const hpCurrent = payload.hp_current ?? payload.hp?.current ?? payload.hp?.value;
    const hpMax = payload.hp_max ?? payload.hp?.max;
    if (className) {
      metaItems.push(`Класс: ${className}`);
    }
    if (level != null) {
      metaItems.push(`Уровень: ${level}`);
    }
    if (hpCurrent != null || hpMax != null) {
      metaItems.push(
        `HP: ${hpCurrent != null ? hpCurrent : "—"}${hpMax != null ? `/${hpMax}` : ""}`,
      );
    }
  }
  if (kind === "quest") {
    if (payload.objectives?.length) {
      metaItems.push(`Цели: ${payload.objectives.length}`);
    }
    if (payload.cannot_decline) {
      metaItems.push("Нельзя отказаться");
    }
  }
  if (kind === "item") {
    if (payload.rarity) {
      metaItems.push(`Редкость: ${payload.rarity}`);
    }
    if (payload.item_type) {
      metaItems.push(`Тип: ${payload.item_type}`);
    }
    const mods = formatStatMods(payload.stat_mods);
    if (mods) {
      metaItems.push(`Бонусы: ${mods}`);
    }
  }
  metaItems.forEach((text) => {
    const line = document.createElement("div");
    line.textContent = text;
    meta.appendChild(line);
  });

  const body = document.createElement("div");
  body.className = "chat-link-card__body";
  const description =
    payload.description || payload.summary || payload.note || payload.details || "";
  if (description) {
    const desc = document.createElement("div");
    desc.textContent = description;
    body.appendChild(desc);
  }

  if (kind === "quest" && Array.isArray(payload.objectives) && payload.objectives.length) {
    const list = document.createElement("ul");
    list.className = "chat-link-card__list";
    payload.objectives.slice(0, 3).forEach((objective) => {
      const item = document.createElement("li");
      item.textContent = objective.text || "Цель";
      list.appendChild(item);
    });
    body.appendChild(list);
  }

  if (kind === "item" && Array.isArray(payload.tags) && payload.tags.length) {
    const tags = document.createElement("div");
    tags.className = "chat-link-card__tags";
    payload.tags.forEach((tagText) => {
      const tag = document.createElement("span");
      tag.className = "tag";
      tag.textContent = tagText;
      tags.appendChild(tag);
    });
    body.appendChild(tags);
  }

  card.appendChild(header);
  if (meta.childElementCount) {
    card.appendChild(meta);
  }
  if (body.childElementCount) {
    card.appendChild(body);
  }
  return card;
}

function renderChatMessages() {
  if (!chatMessagesList) {
    return;
  }
  chatMessagesList.innerHTML = "";
  const chat = state.selectedChatId ? state.chats?.[state.selectedChatId] : null;
  if (!chat) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = "Выберите чат для просмотра сообщений.";
    chatMessagesList.appendChild(empty);
    return;
  }
  const messages = chat.messages || [];
  if (!messages.length) {
    const empty = document.createElement("div");
    empty.className = "meta";
    empty.textContent = "Сообщений пока нет.";
    chatMessagesList.appendChild(empty);
    return;
  }
  messages.forEach((message) => {
    const item = document.createElement("div");
    item.className = "chat-message";

    const meta = document.createElement("div");
    meta.className = "chat-message__meta";
    const sender = document.createElement("div");
    sender.className = "chat-message__sender";
    sender.textContent =
      message.sender_contact_id === state.character?.id
        ? "Вы"
        : getContactLabel(message.sender_contact_id);
    const time = document.createElement("div");
    time.textContent = formatChatTimestamp(message.created_at);
    meta.appendChild(sender);
    meta.appendChild(time);

    const text = document.createElement("div");
    text.className = "chat-message__text";
    text.textContent = message.text || "";

    item.appendChild(meta);
    item.appendChild(text);

    if (message.links?.length) {
      const links = document.createElement("div");
      links.className = "chat-message__links";
      const cards = document.createElement("div");
      cards.className = "chat-message__cards";
      message.links.forEach((link) => {
        const tag = document.createElement("div");
        tag.className = "chat-link-tag";
        tag.textContent = `${link.title || link.label || link.id} (${link.kind || link.type})`;
        links.appendChild(tag);
        cards.appendChild(buildChatLinkCard(link));
      });
      item.appendChild(links);
      item.appendChild(cards);
    }

    chatMessagesList.appendChild(item);
  });
  chatMessagesList.scrollTop = chatMessagesList.scrollHeight;
}

function renderChat() {
  if (!chatSummaryEl) {
    return;
  }
  chatSummaryEl.textContent = `Чатов: ${Object.keys(state.chats || {}).length}`;
  renderChatThreads();
  renderChatMessages();
  renderChatLinkables();
  renderPendingChatLinks();
  if (chatActiveTitle) {
    const chat = state.selectedChatId ? state.chats?.[state.selectedChatId] : null;
    chatActiveTitle.textContent = chat
      ? `Чат: ${getContactLabel(chat.contact_id)}`
      : "Выберите чат";
  }
  if (chatMessageText) {
    chatMessageText.disabled = !state.selectedChatId;
  }
  if (chatMessageSendBtn) {
    chatMessageSendBtn.disabled = !state.selectedChatId;
  }
  if (!state.selectedChatId) {
    setChatMessageStatus("Выберите чат для отправки.");
  }
}

function renderRequests() {
  const requests = Object.values(state.friendRequests).filter((req) => !req.accepted);
  contactsCount.textContent = `Контакты: ${Object.keys(state.contacts).length}`;
  chatsCount.textContent = `Чаты: ${Object.keys(state.chats).length}`;

  requestsList.innerHTML = "";
  if (requests.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Пока нет новых заявок.";
    requestsList.appendChild(empty);
    return;
  }

  requests.forEach((request) => {
    const contact = state.contacts[request.contact_id];
    const card = document.createElement("div");
    card.className = "request";

    const meta = document.createElement("div");
    meta.className = "request__meta";

    const title = document.createElement("div");
    title.className = "request__title";
    title.textContent = contact ? contact.display_name : "Неизвестный контакт";

    const subtitle = document.createElement("div");
    subtitle.className = "request__subtitle";
    subtitle.textContent = `ID заявки: ${request.id}`;

    meta.appendChild(title);
    meta.appendChild(subtitle);

    const button = document.createElement("button");
    button.textContent = "Принять";
    button.addEventListener("click", () => acceptRequest(request.id, button));
    if (state.character?.frozen) {
      button.disabled = true;
    }

    card.appendChild(meta);
    card.appendChild(button);

    requestsList.appendChild(card);
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
  renderRequests();
  renderQuestGroups();
  renderAbilities();
  renderMessages();
  renderChat();
  renderLog();
}

function updateQuestFilter() {
  if (!questSearchInput) {
    return;
  }
  state.questQuery = questSearchInput.value;
  renderQuestGroups();
}

async function acceptRequest(requestId, button) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  button.disabled = true;
  try {
    const response = await fetch(`/api/player/friend-requests/${requestId}/accept`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || "Не удалось принять заявку");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setStatus("Заявка принята", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

async function chooseMessageOption(messageId, optionId, button) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  if (button) {
    button.disabled = true;
  }
  try {
    const response = await fetch(`/api/player/messages/${messageId}/choice`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ option_id: optionId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось отправить выбор");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setStatus("Выбор принят", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

function addChatLink() {
  if (!chatLinkTypeSelect || !chatLinkEntitySelect) {
    return;
  }
  const type = chatLinkTypeSelect.value;
  const selectedId = chatLinkEntitySelect.value;
  if (!selectedId) {
    setChatMessageStatus("Сущность для ссылки не выбрана", "error");
    return;
  }
  const selectedOption = chatLinkEntitySelect.selectedOptions?.[0];
  const label = selectedOption?.textContent || selectedId;
  state.pendingChatLinks.push({ type, id: selectedId, label });
  renderPendingChatLinks();
}

async function sendChatMessage() {
  const token = getToken();
  if (!token) {
    setChatMessageStatus("Укажите токен", "error");
    return;
  }
  const chatId = state.selectedChatId;
  if (!chatId) {
    setChatMessageStatus("Выберите чат", "error");
    return;
  }
  const text = chatMessageText?.value.trim() || "";
  if (!text) {
    setChatMessageStatus("Введите сообщение", "error");
    return;
  }
  chatMessageSendBtn.disabled = true;
  setChatMessageStatus("Отправка...");
  try {
    const response = await fetch(`/api/player/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ text, links: state.pendingChatLinks }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось отправить сообщение");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setChatMessageStatus("Сообщение отправлено", "ok");
    chatMessageText.value = "";
    state.pendingChatLinks = [];
    renderPendingChatLinks();
  } catch (error) {
    setChatMessageStatus(error.message, "error");
  } finally {
    chatMessageSendBtn.disabled = false;
  }
}

async function requestEquip(itemId, slot, button) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  button.disabled = true;
  try {
    const response = await fetch("/api/player/equip-request", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ item_instance_id: itemId, slot }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось отправить запрос");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setStatus("Запрос отправлен", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

async function allocateStatPoints(statId, amount) {
  const token = getToken();
  if (!token) {
    setStatsStatus("Укажите токен", "error");
    return;
  }
  if (!statId) {
    setStatsStatus("Стата не выбрана", "error");
    return;
  }
  if (!amount || amount <= 0) {
    setStatsStatus("Нужно больше очков", "error");
    return;
  }
  setStatsStatus("Распределяем...");
  try {
    const response = await fetch("/api/player/stats/allocate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ stat_id: statId, amount }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось распределить очки");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setStatsStatus("Очки распределены", "ok");
  } catch (error) {
    setStatsStatus(error.message, "error");
  }
}

connectBtn.addEventListener("click", fetchSnapshot);
refreshBtn.addEventListener("click", fetchSnapshot);

if (chatLinkTypeSelect) {
  chatLinkTypeSelect.addEventListener("change", renderChatLinkables);
}

if (chatLinkAddBtn) {
  chatLinkAddBtn.addEventListener("click", addChatLink);
}

if (chatMessageSendBtn) {
  chatMessageSendBtn.addEventListener("click", sendChatMessage);
}

if (questSearchInput) {
  questSearchInput.addEventListener("input", updateQuestFilter);
}

state.audioSettings = loadAudioSettings();
syncAudioControls();
bindAudioControl(soundMasterInput, "master");
bindAudioControl(soundInfoInput, "info");
bindAudioControl(soundWarningInput, "warning");
bindAudioControl(soundAlertInput, "alert");
bindAudioControl(soundLevelUpInput, "level_up");

tokenInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    fetchSnapshot();
  }
});

const storedToken = localStorage.getItem("playerToken");
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
