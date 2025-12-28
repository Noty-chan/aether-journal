const tokenInput = document.getElementById("token-input");
const connectBtn = document.getElementById("connect-btn");
const refreshBtn = document.getElementById("refresh-btn");
const statusEl = document.getElementById("status");
const requestsList = document.getElementById("requests-list");
const contactsCount = document.getElementById("contacts-count");
const chatsCount = document.getElementById("chats-count");

const state = {
  contacts: {},
  chats: {},
  friendRequests: {},
  token: "",
};

function setStatus(message, variant = "") {
  statusEl.textContent = message;
  statusEl.classList.remove("status--ok", "status--error");
  if (variant) {
    statusEl.classList.add(`status--${variant}`);
  }
}

function saveToken(token) {
  localStorage.setItem("playerToken", token);
  state.token = token;
}

function getToken() {
  return state.token || tokenInput.value.trim();
}

function applySnapshot(snapshot) {
  state.contacts = snapshot.contacts || {};
  state.chats = snapshot.chats || {};
  state.friendRequests = snapshot.friend_requests || {};
  render();
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

function applyEvent(event) {
  switch (event.kind) {
    case "chat.friend_request.sent": {
      const { request_id, contact_id } = event.payload;
      ensureContact(contact_id);
      state.friendRequests[request_id] = {
        id: request_id,
        contact_id,
        created_at: event.ts,
        accepted: false,
        accepted_at: null,
      };
      break;
    }
    case "chat.friend_request.accepted": {
      const { request_id, contact_id, chat_id } = event.payload;
      const request = state.friendRequests[request_id] || {
        id: request_id,
        contact_id,
        created_at: event.ts,
      };
      request.accepted = true;
      request.accepted_at = event.ts;
      state.friendRequests[request_id] = request;
      ensureContact(contact_id);
      if (!state.chats[chat_id]) {
        state.chats[chat_id] = {
          id: chat_id,
          contact_id,
          opened: true,
          messages: [],
        };
      } else {
        state.chats[chat_id].opened = true;
      }
      break;
    }
    default:
      break;
  }
  render();
}

function render() {
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

    card.appendChild(meta);
    card.appendChild(button);

    requestsList.appendChild(card);
  });
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
    setStatus("Подключено", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  }
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
    (payload.events || []).forEach(applyEvent);
    setStatus("Заявка принята", "ok");
  } catch (error) {
    setStatus(error.message, "error");
  } finally {
    button.disabled = false;
  }
}

connectBtn.addEventListener("click", fetchSnapshot);
refreshBtn.addEventListener("click", fetchSnapshot);

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

render();
