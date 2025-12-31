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
const levelUpInput = document.getElementById("level-up-input");
const levelUpSubmitBtn = document.getElementById("level-up-submit");
const levelUpStatusEl = document.getElementById("level-up-status");
const sheetSectionsContainer = document.getElementById("sheet-sections");
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
const rulesClassSelect = document.getElementById("rules-class-select");
const rulesClassBonusInput = document.getElementById("rules-class-bonus");
const rulesClassSaveBtn = document.getElementById("rules-class-save");
const rulesClassStatusEl = document.getElementById("rules-class-status");
const sheetSettingsContainer = document.getElementById("sheet-settings");
const sheetSettingsSaveBtn = document.getElementById("sheet-settings-save");
const sheetSettingsResetBtn = document.getElementById("sheet-settings-reset");
const sheetSettingsStatusEl = document.getElementById("sheet-settings-status");
const exportTemplatesBtn = document.getElementById("export-templates-btn");
const importTemplatesInput = document.getElementById("import-templates-file");
const importTemplatesBtn = document.getElementById("import-templates-btn");
const exportLogBtn = document.getElementById("export-log-btn");
const importLogInput = document.getElementById("import-log-file");
const importLogBtn = document.getElementById("import-log-btn");
const exportChatsBtn = document.getElementById("export-chats-btn");
const importChatsInput = document.getElementById("import-chats-file");
const importChatsBtn = document.getElementById("import-chats-btn");
const exportImportStatusEl = document.getElementById("export-import-status");
const itemTemplateNameInput = document.getElementById("item-template-name");
const itemTemplateTypeSelect = document.getElementById("item-template-type");
const itemTemplateRaritySelect = document.getElementById("item-template-rarity");
const itemTemplateDescriptionInput = document.getElementById("item-template-description");
const itemTemplateSlotsInput = document.getElementById("item-template-slots");
const itemTemplateStatModsInput = document.getElementById("item-template-stat-mods");
const itemTemplateTagsInput = document.getElementById("item-template-tags");
const itemTemplateTwoHandedInput = document.getElementById("item-template-two-handed");
const itemTemplateSearchInput = document.getElementById("item-template-search");
const itemTemplateFilterTypeSelect = document.getElementById("item-template-filter-type");
const itemTemplateFilterRaritySelect = document.getElementById("item-template-filter-rarity");
const itemTemplateFilterClassSelect = document.getElementById("item-template-filter-class");
const itemTemplateFilterTwoHandedInput = document.getElementById(
  "item-template-filter-two-handed",
);
const itemTemplateSaveBtn = document.getElementById("item-template-save");
const itemTemplateStatusEl = document.getElementById("item-template-status");
const itemTemplatesList = document.getElementById("item-templates-list");
const itemTemplatesCountEl = document.getElementById("item-templates-count");
const messageTemplateNameInput = document.getElementById("message-template-name");
const messageTemplateTitleInput = document.getElementById("message-template-title");
const messageTemplateBodyInput = document.getElementById("message-template-body");
const messageTemplateSeveritySelect = document.getElementById("message-template-severity");
const messageTemplateCollapsibleInput = document.getElementById(
  "message-template-collapsible",
);
const messageTemplateSaveBtn = document.getElementById("message-template-save");
const messageTemplateStatusEl = document.getElementById("message-template-status");
const messageTemplatesList = document.getElementById("message-templates-list");
const messageTemplatesCountEl = document.getElementById("message-templates-count");
const messageTemplateSearchInput = document.getElementById("message-template-search");
const questTemplateSearchInput = document.getElementById("quest-template-search");
const questTemplatesCountEl = document.getElementById("quest-templates-count");
const chatSummaryEl = document.getElementById("chat-summary");
const chatContactNameInput = document.getElementById("chat-contact-name");
const chatContactPayloadInput = document.getElementById("chat-contact-payload");
const chatContactAddBtn = document.getElementById("chat-contact-add");
const chatContactStatusEl = document.getElementById("chat-contact-status");
const chatContactsList = document.getElementById("chat-contacts-list");
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
const iconPackSelect = document.getElementById("icon-pack-select");

const {
  itemTemplateMatches = () => true,
  questTemplateMatches = () => true,
  messageTemplateMatches = () => true,
} = window.AetherFilters || {};

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

const AUDIO_SETTINGS_KEY = "hostAudioSettings";
const ICON_PACK_KEY = "hostIconPack";
const DEFAULT_ICON_PACK = "pack-default";
const ICON_PACKS = {
  "pack-default": "По умолчанию",
  "pack-alt": "Альтернативный",
};

const state = {
  token: "",
  snapshot: null,
  settings: null,
  character: null,
  classes: {},
  templates: {},
  messageTemplates: {},
  questTemplates: {},
  itemTemplateFilters: {
    query: "",
    type: "",
    rarity: "",
    twoHanded: false,
    classId: "",
  },
  questTemplateFilters: {
    query: "",
    onlyMandatory: false,
  },
  messageTemplateFilters: {
    query: "",
    severity: "",
  },
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
  audioSettings: { ...DEFAULT_AUDIO_SETTINGS },
  iconPack: DEFAULT_ICON_PACK,
  eventLog: [],
  eventSeqs: new Set(),
  classOptionsKey: "",
  itemTemplateClassOptionsKey: "",
  sheetSectionsKey: "",
  sheetSectionNodes: {},
  sheetSettingsKey: "",
  contacts: {},
  chats: {},
  friendRequests: {},
  linkables: { npcs: [], quests: [], items: [] },
  selectedChatId: null,
  pendingChatLinks: [],
  dragPayload: null,
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

function setLevelUpStatus(message, variant = "") {
  if (!levelUpStatusEl) {
    return;
  }
  levelUpStatusEl.textContent = message;
  levelUpStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    levelUpStatusEl.classList.add(`status--${variant}`);
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

function setRulesClassStatus(message, variant = "") {
  if (!rulesClassStatusEl) {
    return;
  }
  rulesClassStatusEl.textContent = message;
  rulesClassStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    rulesClassStatusEl.classList.add(`status--${variant}`);
  }
}

function setSheetSettingsStatus(message, variant = "") {
  if (!sheetSettingsStatusEl) {
    return;
  }
  sheetSettingsStatusEl.textContent = message;
  sheetSettingsStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    sheetSettingsStatusEl.classList.add(`status--${variant}`);
  }
}

function setExportImportStatus(message, variant = "") {
  if (!exportImportStatusEl) {
    return;
  }
  exportImportStatusEl.textContent = message;
  exportImportStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    exportImportStatusEl.classList.add(`status--${variant}`);
  }
}

function setItemTemplateStatus(message, variant = "") {
  if (!itemTemplateStatusEl) {
    return;
  }
  itemTemplateStatusEl.textContent = message;
  itemTemplateStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    itemTemplateStatusEl.classList.add(`status--${variant}`);
  }
}

function setMessageTemplateStatus(message, variant = "") {
  if (!messageTemplateStatusEl) {
    return;
  }
  messageTemplateStatusEl.textContent = message;
  messageTemplateStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    messageTemplateStatusEl.classList.add(`status--${variant}`);
  }
}

function setChatContactStatus(message, variant = "") {
  if (!chatContactStatusEl) {
    return;
  }
  chatContactStatusEl.textContent = message;
  chatContactStatusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    chatContactStatusEl.classList.add(`status--${variant}`);
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

function getSelectedClassId() {
  return rulesClassSelect?.value || state.character?.class_id || "";
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

function getPendingRequest(contactId) {
  return Object.values(state.friendRequests || {}).find(
    (request) => request.contact_id === contactId && !request.accepted,
  );
}

function getChatByContact(contactId) {
  return Object.values(state.chats || {}).find((chat) => chat.contact_id === contactId);
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

function resolveIconPack(value) {
  return ICON_PACKS[value] ? value : DEFAULT_ICON_PACK;
}

function loadIconPack() {
  return resolveIconPack(localStorage.getItem(ICON_PACK_KEY));
}

function saveIconPack(pack) {
  localStorage.setItem(ICON_PACK_KEY, pack);
}

function applyIconPack(pack) {
  const resolved = resolveIconPack(pack);
  const icons = document.querySelectorAll("[data-icon]");
  icons.forEach((icon) => {
    const name = icon.dataset.icon;
    if (!name || icon.tagName !== "IMG") {
      return;
    }
    icon.src = `/icons/${resolved}/${name}.svg`;
    if (resolved !== DEFAULT_ICON_PACK) {
      icon.onerror = () => {
        icon.onerror = null;
        icon.src = `/icons/${DEFAULT_ICON_PACK}/${name}.svg`;
      };
    } else {
      icon.onerror = null;
    }
  });
  return resolved;
}

function syncIconPackControl() {
  if (!iconPackSelect) {
    return;
  }
  iconPackSelect.value = state.iconPack;
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

function debounce(callback, delay = 200) {
  let timeoutId;
  return (...args) => {
    window.clearTimeout(timeoutId);
    timeoutId = window.setTimeout(() => {
      callback(...args);
    }, delay);
  };
}

function resolveCurrentClassId() {
  return state.character?.class_id || "";
}

function syncFilterChipStates() {
  document.querySelectorAll("[data-filter-target]").forEach((chip) => {
    const target = chip.dataset.filterTarget;
    const field = chip.dataset.filterField;
    const value = chip.dataset.filterValue ?? "";
    let active = false;
    if (target === "item") {
      if (field === "type") {
        active = (state.itemTemplateFilters.type || "") === value;
      } else if (field === "rarity") {
        active = (state.itemTemplateFilters.rarity || "") === value;
      } else if (field === "twoHanded") {
        active = state.itemTemplateFilters.twoHanded === (value === "true");
      } else if (field === "classId") {
        const classId = value === "current" ? resolveCurrentClassId() : value;
        active = (state.itemTemplateFilters.classId || "") === (classId || "");
      }
    }
    if (target === "quest" && field === "onlyMandatory") {
      const current = state.questTemplateFilters.onlyMandatory ? "true" : "";
      active = current === value;
    }
    if (target === "message" && field === "severity") {
      active = (state.messageTemplateFilters.severity || "") === value;
    }
    chip.classList.toggle("chip--active", active);
  });
}

function handleFilterChipClick(chip) {
  const target = chip.dataset.filterTarget;
  const field = chip.dataset.filterField;
  const value = chip.dataset.filterValue ?? "";
  if (target === "item") {
    if (field === "type") {
      state.itemTemplateFilters.type =
        state.itemTemplateFilters.type === value ? "" : value;
      if (itemTemplateFilterTypeSelect) {
        itemTemplateFilterTypeSelect.value = state.itemTemplateFilters.type;
      }
    }
    if (field === "rarity") {
      state.itemTemplateFilters.rarity =
        state.itemTemplateFilters.rarity === value ? "" : value;
      if (itemTemplateFilterRaritySelect) {
        itemTemplateFilterRaritySelect.value = state.itemTemplateFilters.rarity;
      }
    }
    if (field === "twoHanded") {
      state.itemTemplateFilters.twoHanded = !state.itemTemplateFilters.twoHanded;
      if (itemTemplateFilterTwoHandedInput) {
        itemTemplateFilterTwoHandedInput.checked = state.itemTemplateFilters.twoHanded;
      }
    }
    if (field === "classId") {
      const resolvedValue = value === "current" ? resolveCurrentClassId() : value;
      state.itemTemplateFilters.classId =
        state.itemTemplateFilters.classId === resolvedValue ? "" : resolvedValue;
      if (itemTemplateFilterClassSelect) {
        itemTemplateFilterClassSelect.value = state.itemTemplateFilters.classId;
      }
    }
    renderItemTemplates();
  }
  if (target === "quest" && field === "onlyMandatory") {
    state.questTemplateFilters.onlyMandatory = value === "true";
    renderQuestTemplates();
  }
  if (target === "message" && field === "severity") {
    state.messageTemplateFilters.severity = value;
    renderMessageTemplates();
  }
  syncFilterChipStates();
}

const DRAG_TYPES = {
  itemTemplate: "item-template",
  questTemplate: "quest-template",
  messageTemplate: "message-template",
};

function registerDragSource(element, payload) {
  if (!element) {
    return;
  }
  element.setAttribute("draggable", "true");
  element.classList.add("drag-source");
  element.addEventListener("dragstart", (event) => {
    state.dragPayload = payload;
    element.classList.add("is-dragging");
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = "copy";
      event.dataTransfer.setData("text/plain", JSON.stringify(payload));
    }
  });
  element.addEventListener("dragend", () => {
    state.dragPayload = null;
    element.classList.remove("is-dragging");
    clearDropZoneHighlights();
  });
}

function clearDropZoneHighlights() {
  document
    .querySelectorAll(".drop-zone--active")
    .forEach((zone) => zone.classList.remove("drop-zone--active"));
}

function registerDropZone(element, { accepts = [], onDrop } = {}) {
  if (!element) {
    return;
  }
  element.classList.add("drop-zone");
  const canAccept = () =>
    state.dragPayload && accepts.includes(state.dragPayload.type);
  element.addEventListener("dragenter", (event) => {
    if (!canAccept()) {
      return;
    }
    event.preventDefault();
    element.classList.add("drop-zone--active");
  });
  element.addEventListener("dragover", (event) => {
    if (!canAccept()) {
      return;
    }
    event.preventDefault();
  });
  element.addEventListener("dragleave", (event) => {
    if (event.relatedTarget && element.contains(event.relatedTarget)) {
      return;
    }
    element.classList.remove("drop-zone--active");
  });
  element.addEventListener("drop", (event) => {
    if (!canAccept()) {
      return;
    }
    event.preventDefault();
    element.classList.remove("drop-zone--active");
    const payload = state.dragPayload;
    if (payload && onDrop) {
      onDrop(payload);
    }
  });
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
  state.lastLevelUp = {
    level: payload.new_level,
    ts: payload.ts,
  };
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
    state.sheetSettingsKey = "";
  }
  renderSettings();
}

function applyClassBonusUpdated(payload) {
  if (!payload?.class_id) {
    return;
  }
  if (!state.classes[payload.class_id]) {
    return;
  }
  state.classes[payload.class_id].per_level_bonus = payload.per_level_bonus || {};
  renderSettings();
}

function applyItemTemplateUpserted(payload) {
  const template = payload?.template;
  if (!template || !template.id) {
    return;
  }
  state.templates[template.id] = template;
  renderItemTemplates();
}

function applyMessageTemplateUpserted(payload) {
  const template = payload?.template;
  if (!template || !template.id) {
    return;
  }
  state.messageTemplates[template.id] = template;
  renderMessageTemplates();
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

function applyChatFriendRequestSent(payload) {
  const requestId = payload?.request_id;
  const contactId = payload?.contact_id;
  if (!requestId || !contactId) {
    return;
  }
  state.friendRequests[requestId] = {
    id: requestId,
    contact_id: contactId,
    created_at: payload.created_at || new Date().toISOString(),
    accepted: false,
    accepted_at: null,
  };
}

function applyChatFriendRequestAccepted(payload) {
  const requestId = payload?.request_id;
  const contactId = payload?.contact_id;
  const chatId = payload?.chat_id;
  if (requestId && state.friendRequests[requestId]) {
    state.friendRequests[requestId].accepted = true;
    state.friendRequests[requestId].accepted_at = payload.accepted_at || new Date().toISOString();
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
    case "xp.granted":
      applyXpGranted(Number(event.payload.amount ?? 0));
      break;
    case "level.up":
      applyLevelUpEvent({ ...event.payload, ts: event.ts });
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
    case "chat.contact.added":
      applyChatContactAdded(event.payload);
      break;
    case "chat.friend_request.sent":
      applyChatFriendRequestSent(event.payload);
      break;
    case "chat.friend_request.accepted":
      applyChatFriendRequestAccepted(event.payload);
      break;
    case "chat.message":
      applyChatMessage(event);
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
  state.classOptionsKey = "";
  state.sheetSectionsKey = "";
  state.sheetSectionNodes = {};
  state.sheetSettingsKey = "";
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
    const response = await fetch("/api/host/linkables", {
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

async function downloadExport(endpoint, filename) {
  const token = getToken();
  if (!token) {
    setExportImportStatus("Укажите токен", "error");
    return;
  }
  setExportImportStatus("Экспорт...");
  try {
    const response = await fetch(endpoint, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) {
      throw new Error("Не удалось экспортировать");
    }
    const payload = await response.json();
    const blob = new Blob([JSON.stringify(payload, null, 2)], {
      type: "application/json",
    });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
    URL.revokeObjectURL(link.href);
    setExportImportStatus("Экспорт готов", "ok");
  } catch (error) {
    setExportImportStatus(error.message, "error");
  }
}

async function importPayloadFromFile(inputEl, endpoint) {
  const token = getToken();
  if (!token) {
    setExportImportStatus("Укажите токен", "error");
    return;
  }
  const file = inputEl?.files?.[0];
  if (!file) {
    setExportImportStatus("Выберите JSON-файл", "error");
    return;
  }
  setExportImportStatus("Импорт...");
  try {
    const text = await file.text();
    let payload;
    try {
      payload = JSON.parse(text);
    } catch (error) {
      throw new Error("Файл не содержит корректный JSON");
    }
    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось импортировать");
    }
    setExportImportStatus("Импорт выполнен", "ok");
    if (inputEl) {
      inputEl.value = "";
    }
    await fetchSnapshot();
  } catch (error) {
    setExportImportStatus(error.message, "error");
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

function renderSheetSettings() {
  if (!sheetSettingsContainer) {
    return;
  }
  if (sheetSettingsContainer.contains(document.activeElement)) {
    return;
  }
  const sections = getSheetSectionsConfig()
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  const key = JSON.stringify(sections);
  if (state.sheetSettingsKey === key && sheetSettingsContainer.childElementCount) {
    return;
  }
  sheetSettingsContainer.innerHTML = "";
  sections.forEach((section, index) => {
    const row = document.createElement("div");
    row.className = "sheet-settings__row";
    row.dataset.key = section.key;

    const label = document.createElement("div");
    label.className = "sheet-settings__label";
    label.textContent = SHEET_SECTION_INFO[section.key]?.label || section.key;

    const titleInput = document.createElement("input");
    titleInput.type = "text";
    titleInput.value = section.title || section.key;
    titleInput.dataset.field = "title";

    const orderInput = document.createElement("input");
    orderInput.type = "number";
    orderInput.min = "1";
    orderInput.value = String(section.order ?? index + 1);
    orderInput.dataset.field = "order";

    const visibleLabel = document.createElement("label");
    visibleLabel.className = "sheet-settings__checkbox";
    const visibleInput = document.createElement("input");
    visibleInput.type = "checkbox";
    visibleInput.checked = section.visible ?? true;
    visibleInput.dataset.field = "visible";
    const visibleText = document.createElement("span");
    visibleText.textContent = "Показывать";
    visibleLabel.appendChild(visibleInput);
    visibleLabel.appendChild(visibleText);

    const moveWrap = document.createElement("div");
    moveWrap.className = "sheet-settings__move";
    const moveUp = document.createElement("button");
    moveUp.type = "button";
    moveUp.className = "ghost sheet-settings__move-btn";
    moveUp.textContent = "↑";
    moveUp.dataset.move = "up";
    const moveDown = document.createElement("button");
    moveDown.type = "button";
    moveDown.className = "ghost sheet-settings__move-btn";
    moveDown.textContent = "↓";
    moveDown.dataset.move = "down";
    moveWrap.appendChild(moveUp);
    moveWrap.appendChild(moveDown);

    row.appendChild(label);
    row.appendChild(titleInput);
    row.appendChild(orderInput);
    row.appendChild(visibleLabel);
    row.appendChild(moveWrap);
    sheetSettingsContainer.appendChild(row);
  });
  state.sheetSettingsKey = key;
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

  if (state.sheetSectionNodes.stats) {
    renderList(state.sheetSectionNodes.stats.list, stats, state.sheetSectionNodes.stats.empty);
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
  const filtered = templates.filter((template) =>
    questTemplateMatches(template, state.questTemplateFilters),
  );
  if (questTemplatesCountEl) {
    questTemplatesCountEl.textContent =
      state.questTemplateFilters.query || state.questTemplateFilters.onlyMandatory
        ? `${filtered.length} / ${templates.length}`
        : `${templates.length}`;
  }
  if (templates.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list__item";
    empty.textContent = "Нет доступных шаблонов.";
    questTemplatesList.appendChild(empty);
    return;
  }
  if (filtered.length === 0) {
    const empty = document.createElement("div");
    empty.className = "list__item";
    empty.textContent = "Шаблоны не найдены.";
    questTemplatesList.appendChild(empty);
    return;
  }
  const activeTemplateIds = new Set(
    (state.activeQuests || [])
      .filter((quest) => !["completed", "failed"].includes(quest.status))
      .map((quest) => quest.template_id),
  );
  filtered
    .sort((a, b) => a.name.localeCompare(b.name, "ru"))
    .forEach((template) => {
      const row = document.createElement("div");
      row.className = "list__item";
      registerDragSource(row, { type: DRAG_TYPES.questTemplate, id: template.id });
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

function renderChatContacts() {
  if (!chatContactsList) {
    return;
  }
  chatContactsList.innerHTML = "";
  const contacts = Object.values(state.contacts || {});
  if (!contacts.length) {
    const empty = document.createElement("div");
    empty.className = "list__item";
    empty.textContent = "Контактов пока нет.";
    chatContactsList.appendChild(empty);
    return;
  }
  contacts
    .sort((a, b) => (a.display_name || "").localeCompare(b.display_name || "", "ru"))
    .forEach((contact) => {
      const row = document.createElement("div");
      row.className = "list-row";
      const info = document.createElement("div");
      info.className = "list-row__info";
      const title = document.createElement("div");
      title.textContent = contact.display_name || contact.id;
      const meta = document.createElement("div");
      meta.className = "meta";

      const openChat = getChatByContact(contact.id);
      const pending = getPendingRequest(contact.id);
      if (openChat?.opened) {
        meta.textContent = `Чат открыт · ${openChat.id}`;
      } else if (pending) {
        meta.textContent = `Заявка отправлена · ${pending.id}`;
      } else {
        meta.textContent = "Чат ещё не открыт";
      }

      info.appendChild(title);
      info.appendChild(meta);

      const actions = document.createElement("div");
      if (openChat) {
        const openBtn = document.createElement("button");
        openBtn.type = "button";
        openBtn.className = "ghost";
        openBtn.textContent = "Открыть";
        openBtn.addEventListener("click", () => {
          state.selectedChatId = openChat.id;
          state.pendingChatLinks = [];
          renderChat();
        });
        actions.appendChild(openBtn);
      } else if (!pending) {
        const requestBtn = document.createElement("button");
        requestBtn.type = "button";
        requestBtn.className = "ghost";
        requestBtn.textContent = "Отправить заявку";
        requestBtn.addEventListener("click", () => sendFriendRequest(contact.id, requestBtn));
        actions.appendChild(requestBtn);
      }

      row.appendChild(info);
      row.appendChild(actions);
      chatContactsList.appendChild(row);
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
    if (message.sender_contact_id === state.character?.id) {
      sender.textContent = "Игрок";
    } else {
      sender.textContent = getContactLabel(message.sender_contact_id);
    }
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
  chatSummaryEl.textContent = `Контактов: ${Object.keys(state.contacts || {}).length} · Чатов: ${
    Object.keys(state.chats || {}).length
  }`;
  renderChatContacts();
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

function renderItemTemplates() {
  if (!itemTemplatesList) {
    return;
  }
  const templates = Object.values(state.templates || {});
  const filtered = templates.filter((template) =>
    itemTemplateMatches(template, state.itemTemplateFilters, state.classes),
  );
  itemTemplatesList.innerHTML = "";
  if (itemTemplatesCountEl) {
    itemTemplatesCountEl.textContent =
      state.itemTemplateFilters.query ||
      state.itemTemplateFilters.type ||
      state.itemTemplateFilters.rarity ||
      state.itemTemplateFilters.twoHanded ||
      state.itemTemplateFilters.classId
        ? `${filtered.length} / ${templates.length}`
        : `${templates.length}`;
  }
  if (!templates.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Нет шаблонов предметов.";
    itemTemplatesList.appendChild(empty);
    return;
  }
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Шаблоны не найдены.";
    itemTemplatesList.appendChild(empty);
    return;
  }
  filtered
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .forEach((template) => {
      const row = document.createElement("div");
      row.className = "list-row";
      registerDragSource(row, { type: DRAG_TYPES.itemTemplate, id: template.id });
      const info = document.createElement("div");
      info.className = "list-row__info";
      const title = document.createElement("div");
      title.textContent = template.name || "Без названия";
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${template.item_type || "misc"} · ${template.rarity || "white"}`;
      info.appendChild(title);
      info.appendChild(meta);
      const actions = document.createElement("div");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost";
      button.textContent = "Добавить игроку";
      button.addEventListener("click", () => addItemFromTemplate(template.id, button));
      actions.appendChild(button);
      row.appendChild(info);
      row.appendChild(actions);
      itemTemplatesList.appendChild(row);
    });
}

function renderMessageTemplates() {
  if (!messageTemplatesList) {
    return;
  }
  const templates = Object.values(state.messageTemplates || {});
  const filtered = templates.filter((template) =>
    messageTemplateMatches(template, state.messageTemplateFilters),
  );
  messageTemplatesList.innerHTML = "";
  if (messageTemplatesCountEl) {
    messageTemplatesCountEl.textContent =
      state.messageTemplateFilters.query || state.messageTemplateFilters.severity
        ? `${filtered.length} / ${templates.length}`
        : `${templates.length}`;
  }
  if (!templates.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Нет шаблонов сообщений.";
    messageTemplatesList.appendChild(empty);
    return;
  }
  if (!filtered.length) {
    const empty = document.createElement("div");
    empty.className = "empty";
    empty.textContent = "Шаблоны не найдены.";
    messageTemplatesList.appendChild(empty);
    return;
  }
  filtered
    .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    .forEach((template) => {
      const row = document.createElement("div");
      row.className = "list-row";
      registerDragSource(row, { type: DRAG_TYPES.messageTemplate, id: template.id });
      const info = document.createElement("div");
      info.className = "list-row__info";
      const title = document.createElement("div");
      title.textContent = template.name || "Без названия";
      const meta = document.createElement("div");
      meta.className = "meta";
      meta.textContent = `${template.severity || "info"} · ${
        template.collapsible ? "сворач." : "несворач."
      }`;
      info.appendChild(title);
      info.appendChild(meta);
      const actions = document.createElement("div");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ghost";
      button.textContent = "Отправить";
      button.addEventListener("click", () => sendMessageTemplate(template.id, button));
      actions.appendChild(button);
      row.appendChild(info);
      row.appendChild(actions);
      messageTemplatesList.appendChild(row);
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
  if (rulesClassSelect) {
    const classIds = Object.keys(state.classes || {});
    const key = classIds.join("|");
    if (state.classOptionsKey !== key) {
      const selected = getSelectedClassId() || classIds[0] || "";
      rulesClassSelect.innerHTML = "";
      classIds.forEach((classId) => {
        const option = document.createElement("option");
        option.value = classId;
        option.textContent = state.classes[classId]?.name || classId;
        rulesClassSelect.appendChild(option);
      });
      rulesClassSelect.value = selected || classIds[0] || "";
      state.classOptionsKey = key;
    }
  }
  if (rulesClassBonusInput) {
    const classId = getSelectedClassId();
    const bonus = state.classes?.[classId]?.per_level_bonus || {};
    if (document.activeElement !== rulesClassBonusInput) {
      rulesClassBonusInput.value = JSON.stringify(bonus, null, 2);
    }
  }
  renderSheetSettings();
}

function renderItemTemplateClassOptions() {
  if (!itemTemplateFilterClassSelect) {
    return;
  }
  const classIds = Object.keys(state.classes || {});
  const key = classIds.join("|");
  if (state.itemTemplateClassOptionsKey === key) {
    return;
  }
  itemTemplateFilterClassSelect.innerHTML = "";
  const defaultOption = document.createElement("option");
  defaultOption.value = "";
  defaultOption.textContent = "Все классы";
  itemTemplateFilterClassSelect.appendChild(defaultOption);
  classIds.forEach((classId) => {
    const option = document.createElement("option");
    option.value = classId;
    option.textContent = state.classes[classId]?.name || classId;
    itemTemplateFilterClassSelect.appendChild(option);
  });
  const currentValue = state.itemTemplateFilters.classId || "";
  itemTemplateFilterClassSelect.value = classIds.includes(currentValue) ? currentValue : "";
  state.itemTemplateFilters.classId = itemTemplateFilterClassSelect.value;
  state.itemTemplateClassOptionsKey = key;
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
  renderChat();
  renderLog();
  renderSettings();
  renderItemTemplateClassOptions();
  renderItemTemplates();
  renderMessageTemplates();
  syncFilterChipStates();
  if (questCountEl) {
    questCountEl.textContent = `${state.activeQuests?.length || 0}`;
  }
}

function updateItemTemplateFilters() {
  if (itemTemplateSearchInput) {
    state.itemTemplateFilters.query = itemTemplateSearchInput.value;
  }
  if (itemTemplateFilterTypeSelect) {
    state.itemTemplateFilters.type = itemTemplateFilterTypeSelect.value;
  }
  if (itemTemplateFilterRaritySelect) {
    state.itemTemplateFilters.rarity = itemTemplateFilterRaritySelect.value;
  }
  if (itemTemplateFilterClassSelect) {
    state.itemTemplateFilters.classId = itemTemplateFilterClassSelect.value;
  }
  if (itemTemplateFilterTwoHandedInput) {
    state.itemTemplateFilters.twoHanded = itemTemplateFilterTwoHandedInput.checked;
  }
  renderItemTemplates();
  syncFilterChipStates();
}

function updateQuestTemplateFilter() {
  if (!questTemplateSearchInput) {
    return;
  }
  state.questTemplateFilters.query = questTemplateSearchInput.value;
  renderQuestTemplates();
  syncFilterChipStates();
}

function updateMessageTemplateFilters() {
  if (messageTemplateSearchInput) {
    state.messageTemplateFilters.query = messageTemplateSearchInput.value;
  }
  renderMessageTemplates();
  syncFilterChipStates();
}

function setupDropZones() {
  registerDropZone(inventoryList, {
    accepts: [DRAG_TYPES.itemTemplate],
    onDrop: (payload) => addItemFromTemplate(payload.id),
  });
  registerDropZone(questStatusGroups, {
    accepts: [DRAG_TYPES.questTemplate],
    onDrop: (payload) => assignQuest(payload.id),
  });
  registerDropZone(messagesList, {
    accepts: [DRAG_TYPES.messageTemplate],
    onDrop: (payload) => sendMessageTemplate(payload.id),
  });
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

async function grantLevels(levels) {
  const token = getToken();
  if (!token) {
    setStatus("Укажите токен", "error");
    return;
  }
  if (!levels || levels <= 0) {
    setLevelUpStatus("Введите количество уровней", "error");
    return;
  }
  if (levelUpSubmitBtn) {
    levelUpSubmitBtn.disabled = true;
  }
  try {
    const response = await fetch("/api/host/level-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ levels }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось поднять уровень");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    if (levelUpInput) {
      levelUpInput.value = "";
    }
    setLevelUpStatus("Уровни начислены", "ok");
  } catch (error) {
    setLevelUpStatus(error.message, "error");
  } finally {
    if (levelUpSubmitBtn) {
      levelUpSubmitBtn.disabled = false;
    }
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

async function submitSheetSettings(sections) {
  const token = getToken();
  if (!token) {
    setSheetSettingsStatus("Укажите токен", "error");
    return;
  }
  if (!sections.length) {
    setSheetSettingsStatus("Нет секций для сохранения", "error");
    return;
  }
  if (sheetSettingsSaveBtn) {
    sheetSettingsSaveBtn.disabled = true;
  }
  setSheetSettingsStatus("Сохранение...");
  try {
    const response = await fetch("/api/host/settings", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ sheet_sections: sections }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось сохранить настройки листа");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setSheetSettingsStatus("Настройки листа обновлены", "ok");
  } catch (error) {
    setSheetSettingsStatus(error.message, "error");
  } finally {
    if (sheetSettingsSaveBtn) {
      sheetSettingsSaveBtn.disabled = false;
    }
  }
}

async function updateSheetSettings() {
  if (!sheetSettingsContainer) {
    return;
  }
  const rows = Array.from(sheetSettingsContainer.querySelectorAll(".sheet-settings__row"));
  const sections = rows.map((row, index) => {
    const titleInput = row.querySelector('[data-field="title"]');
    const orderInput = row.querySelector('[data-field="order"]');
    const visibleInput = row.querySelector('[data-field="visible"]');
    const orderValue = Number(orderInput?.value);
    return {
      key: row.dataset.key || "",
      title: titleInput?.value?.trim() || row.dataset.key || "",
      visible: Boolean(visibleInput?.checked),
      order: Number.isFinite(orderValue) ? orderValue : index + 1,
    };
  });
  await submitSheetSettings(sections);
}

function swapSheetOrder(row, direction) {
  if (!sheetSettingsContainer) {
    return;
  }
  const rows = Array.from(sheetSettingsContainer.querySelectorAll(".sheet-settings__row"));
  const index = rows.indexOf(row);
  if (index === -1) {
    return;
  }
  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= rows.length) {
    return;
  }
  const currentOrder = row.querySelector('[data-field="order"]');
  const targetOrder = rows[targetIndex].querySelector('[data-field="order"]');
  if (!currentOrder || !targetOrder) {
    return;
  }
  const temp = currentOrder.value;
  currentOrder.value = targetOrder.value;
  targetOrder.value = temp;
}

async function updateClassBonus() {
  const token = getToken();
  if (!token) {
    setRulesClassStatus("Укажите токен", "error");
    return;
  }
  const classId = getSelectedClassId();
  if (!classId) {
    setRulesClassStatus("Выберите класс", "error");
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(rulesClassBonusInput?.value || "{}");
  } catch (error) {
    setRulesClassStatus("Некорректный JSON", "error");
    return;
  }
  rulesClassSaveBtn.disabled = true;
  setRulesClassStatus("Сохранение...");
  try {
    const response = await fetch(`/api/host/classes/${classId}/per-level-bonus`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ per_level_bonus: parsed }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось сохранить бонусы");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setRulesClassStatus("Бонусы обновлены", "ok");
  } catch (error) {
    setRulesClassStatus(error.message, "error");
  } finally {
    rulesClassSaveBtn.disabled = false;
  }
}

async function upsertItemTemplate() {
  const token = getToken();
  if (!token) {
    setItemTemplateStatus("Укажите токен", "error");
    return;
  }
  const name = itemTemplateNameInput?.value.trim() || "";
  if (!name) {
    setItemTemplateStatus("Введите название", "error");
    return;
  }
  let statMods = {};
  if (itemTemplateStatModsInput?.value.trim()) {
    try {
      statMods = JSON.parse(itemTemplateStatModsInput.value);
    } catch (error) {
      setItemTemplateStatus("Некорректный JSON бонусов", "error");
      return;
    }
  }
  const slots = (itemTemplateSlotsInput?.value || "")
    .split(",")
    .map((slot) => slot.trim())
    .filter(Boolean);
  const tags = (itemTemplateTagsInput?.value || "")
    .split(",")
    .map((tag) => tag.trim())
    .filter(Boolean);
  itemTemplateSaveBtn.disabled = true;
  setItemTemplateStatus("Сохранение...");
  try {
    const response = await fetch("/api/host/item-templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        item_type: itemTemplateTypeSelect?.value || "misc",
        rarity: itemTemplateRaritySelect?.value || "white",
        description: itemTemplateDescriptionInput?.value || "",
        equip_slots: slots,
        two_handed: Boolean(itemTemplateTwoHandedInput?.checked),
        stat_mods: statMods,
        tags,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось сохранить шаблон");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setItemTemplateStatus("Шаблон сохранён", "ok");
    itemTemplateNameInput.value = "";
    itemTemplateDescriptionInput.value = "";
    itemTemplateSlotsInput.value = "";
    itemTemplateStatModsInput.value = "";
    itemTemplateTagsInput.value = "";
    itemTemplateTwoHandedInput.checked = false;
  } catch (error) {
    setItemTemplateStatus(error.message, "error");
  } finally {
    itemTemplateSaveBtn.disabled = false;
  }
}

async function addItemFromTemplate(templateId, button) {
  const token = getToken();
  if (!token) {
    setItemTemplateStatus("Укажите токен", "error");
    return;
  }
  if (button) {
    button.disabled = true;
  }
  try {
    const response = await fetch("/api/host/items", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ template_id: templateId, qty: 1 }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось добавить предмет");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setItemTemplateStatus("Предмет добавлен", "ok");
  } catch (error) {
    setItemTemplateStatus(error.message, "error");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function upsertMessageTemplate() {
  const token = getToken();
  if (!token) {
    setMessageTemplateStatus("Укажите токен", "error");
    return;
  }
  const name = messageTemplateNameInput?.value.trim() || "";
  const title = messageTemplateTitleInput?.value.trim() || "";
  const body = messageTemplateBodyInput?.value.trim() || "";
  if (!name || !title || !body) {
    setMessageTemplateStatus("Заполните название, заголовок и текст", "error");
    return;
  }
  messageTemplateSaveBtn.disabled = true;
  setMessageTemplateStatus("Сохранение...");
  try {
    const response = await fetch("/api/host/message-templates", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        name,
        title,
        body,
        severity: messageTemplateSeveritySelect?.value || "info",
        collapsible: Boolean(messageTemplateCollapsibleInput?.checked),
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось сохранить шаблон");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setMessageTemplateStatus("Шаблон сохранён", "ok");
    messageTemplateNameInput.value = "";
    messageTemplateTitleInput.value = "";
    messageTemplateBodyInput.value = "";
    messageTemplateCollapsibleInput.checked = true;
  } catch (error) {
    setMessageTemplateStatus(error.message, "error");
  } finally {
    messageTemplateSaveBtn.disabled = false;
  }
}

async function sendMessageTemplate(templateId, button) {
  const token = getToken();
  if (!token) {
    setMessageTemplateStatus("Укажите токен", "error");
    return;
  }
  const template = state.messageTemplates?.[templateId];
  if (!template) {
    setMessageTemplateStatus("Шаблон не найден", "error");
    return;
  }
  if (button) {
    button.disabled = true;
  }
  try {
    const response = await fetch("/api/host/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        title: template.title,
        body: template.body,
        severity: template.severity || "info",
        collapsible: Boolean(template.collapsible),
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось отправить сообщение");
    }
    const payload = await response.json();
    applyEvents(payload.events || []);
    setMessageTemplateStatus("Сообщение отправлено", "ok");
  } catch (error) {
    setMessageTemplateStatus(error.message, "error");
  } finally {
    if (button) {
      button.disabled = false;
    }
  }
}

async function addChatContact() {
  const token = getToken();
  if (!token) {
    setChatContactStatus("Укажите токен", "error");
    return;
  }
  const displayName = chatContactNameInput?.value.trim() || "";
  if (!displayName) {
    setChatContactStatus("Введите имя контакта", "error");
    return;
  }
  let payload = {};
  if (chatContactPayloadInput?.value.trim()) {
    try {
      payload = JSON.parse(chatContactPayloadInput.value);
    } catch (error) {
      setChatContactStatus("Некорректный JSON payload", "error");
      return;
    }
  }
  chatContactAddBtn.disabled = true;
  setChatContactStatus("Создание контакта...");
  try {
    const response = await fetch("/api/host/contacts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ display_name: displayName, link_payload: payload }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось создать контакт");
    }
    const apiPayload = await response.json();
    applyEvents(apiPayload.events || []);
    setChatContactStatus("Контакт создан", "ok");
    chatContactNameInput.value = "";
    chatContactPayloadInput.value = "";
    await fetchLinkables();
  } catch (error) {
    setChatContactStatus(error.message, "error");
  } finally {
    chatContactAddBtn.disabled = false;
  }
}

async function sendFriendRequest(contactId, button) {
  const token = getToken();
  if (!token) {
    setChatContactStatus("Укажите токен", "error");
    return;
  }
  if (!contactId) {
    setChatContactStatus("Контакт не выбран", "error");
    return;
  }
  if (button) {
    button.disabled = true;
  }
  setChatContactStatus("Отправка заявки...");
  try {
    const response = await fetch("/api/host/friend-requests", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ contact_id: contactId }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось отправить заявку");
    }
    const apiPayload = await response.json();
    applyEvents(apiPayload.events || []);
    setChatContactStatus("Заявка отправлена", "ok");
  } catch (error) {
    setChatContactStatus(error.message, "error");
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
  const chat = state.chats?.[chatId];
  const text = chatMessageText?.value.trim() || "";
  if (!text) {
    setChatMessageStatus("Введите сообщение", "error");
    return;
  }
  if (!chat?.contact_id) {
    setChatMessageStatus("Контакт для чата не найден", "error");
    return;
  }
  chatMessageSendBtn.disabled = true;
  setChatMessageStatus("Отправка...");
  try {
    const response = await fetch(`/api/host/chats/${chatId}/messages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        text,
        sender_contact_id: chat.contact_id,
        links: state.pendingChatLinks,
      }),
    });
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(data.detail || "Не удалось отправить сообщение");
    }
    const apiPayload = await response.json();
    applyEvents(apiPayload.events || []);
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

const debouncedUpdateItemTemplateFilters = debounce(updateItemTemplateFilters, 250);
const debouncedUpdateQuestTemplateFilter = debounce(updateQuestTemplateFilter, 250);
const debouncedUpdateMessageTemplateFilters = debounce(updateMessageTemplateFilters, 250);

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

if (levelUpSubmitBtn) {
  levelUpSubmitBtn.addEventListener("click", () => {
    grantLevels(Number(levelUpInput?.value));
  });
}

if (levelUpInput) {
  levelUpInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      grantLevels(Number(levelUpInput.value));
    }
  });
}

document.querySelectorAll("[data-xp]").forEach((button) => {
  button.addEventListener("click", () => {
    const amount = Number(button.dataset.xp);
    grantXp(amount);
  });
});

if (rulesSaveBtn) {
  rulesSaveBtn.addEventListener("click", updateRulesSettings);
}

if (sheetSettingsSaveBtn) {
  sheetSettingsSaveBtn.addEventListener("click", updateSheetSettings);
}

if (sheetSettingsResetBtn) {
  sheetSettingsResetBtn.addEventListener("click", async () => {
    if (!sheetSettingsContainer) {
      return;
    }
    await submitSheetSettings(DEFAULT_SHEET_SECTIONS.map((section) => ({ ...section })));
  });
}

if (exportTemplatesBtn) {
  exportTemplatesBtn.addEventListener("click", () =>
    downloadExport("/api/export/templates", "aether-templates.json"),
  );
}

if (importTemplatesBtn) {
  importTemplatesBtn.addEventListener("click", () =>
    importPayloadFromFile(importTemplatesInput, "/api/import/templates"),
  );
}

if (exportLogBtn) {
  exportLogBtn.addEventListener("click", () =>
    downloadExport("/api/export/log", "aether-log.json"),
  );
}

if (importLogBtn) {
  importLogBtn.addEventListener("click", () =>
    importPayloadFromFile(importLogInput, "/api/import/log"),
  );
}

if (exportChatsBtn) {
  exportChatsBtn.addEventListener("click", () =>
    downloadExport("/api/export/chats", "aether-chats.json"),
  );
}

if (importChatsBtn) {
  importChatsBtn.addEventListener("click", () =>
    importPayloadFromFile(importChatsInput, "/api/import/chats"),
  );
}

if (sheetSettingsContainer) {
  sheetSettingsContainer.addEventListener("click", (event) => {
    const button = event.target.closest("[data-move]");
    if (!button) {
      return;
    }
    const row = button.closest(".sheet-settings__row");
    if (!row) {
      return;
    }
    swapSheetOrder(row, button.dataset.move);
  });
}

if (rulesClassSaveBtn) {
  rulesClassSaveBtn.addEventListener("click", updateClassBonus);
}

if (rulesClassSelect) {
  rulesClassSelect.addEventListener("change", () => {
    renderSettings();
  });
}

if (itemTemplateSaveBtn) {
  itemTemplateSaveBtn.addEventListener("click", upsertItemTemplate);
}

if (itemTemplateSearchInput) {
  itemTemplateSearchInput.addEventListener("input", debouncedUpdateItemTemplateFilters);
}

if (itemTemplateFilterTypeSelect) {
  itemTemplateFilterTypeSelect.addEventListener("change", updateItemTemplateFilters);
}

if (itemTemplateFilterRaritySelect) {
  itemTemplateFilterRaritySelect.addEventListener("change", updateItemTemplateFilters);
}

if (itemTemplateFilterClassSelect) {
  itemTemplateFilterClassSelect.addEventListener("change", updateItemTemplateFilters);
}

if (itemTemplateFilterTwoHandedInput) {
  itemTemplateFilterTwoHandedInput.addEventListener("change", updateItemTemplateFilters);
}

if (messageTemplateSaveBtn) {
  messageTemplateSaveBtn.addEventListener("click", upsertMessageTemplate);
}

if (questTemplateSearchInput) {
  questTemplateSearchInput.addEventListener("input", debouncedUpdateQuestTemplateFilter);
}

if (messageTemplateSearchInput) {
  messageTemplateSearchInput.addEventListener("input", debouncedUpdateMessageTemplateFilters);
}

if (chatContactAddBtn) {
  chatContactAddBtn.addEventListener("click", addChatContact);
}

if (chatLinkTypeSelect) {
  chatLinkTypeSelect.addEventListener("change", renderChatLinkables);
}

if (chatLinkAddBtn) {
  chatLinkAddBtn.addEventListener("click", addChatLink);
}

if (chatMessageSendBtn) {
  chatMessageSendBtn.addEventListener("click", sendChatMessage);
}

document.addEventListener("click", (event) => {
  const chip = event.target.closest(".chip[data-filter-target]");
  if (chip) {
    handleFilterChipClick(chip);
  }
});

setupDropZones();

state.audioSettings = loadAudioSettings();
syncAudioControls();
bindAudioControl(soundMasterInput, "master");
bindAudioControl(soundInfoInput, "info");
bindAudioControl(soundWarningInput, "warning");
bindAudioControl(soundAlertInput, "alert");
bindAudioControl(soundLevelUpInput, "level_up");

state.iconPack = loadIconPack();
state.iconPack = applyIconPack(state.iconPack);
syncIconPackControl();

if (iconPackSelect) {
  iconPackSelect.addEventListener("change", () => {
    const selected = resolveIconPack(iconPackSelect.value);
    state.iconPack = applyIconPack(selected);
    saveIconPack(state.iconPack);
    syncIconPackControl();
  });
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
