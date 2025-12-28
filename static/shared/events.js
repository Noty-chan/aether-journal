export function hydrateChatState(snapshot) {
  return {
    chats: snapshot?.chats ?? {},
    contacts: snapshot?.contacts ?? {},
    friendRequests: snapshot?.friend_requests ?? {},
  };
}

function ensureChat(chatState, chatId, contactId = "") {
  if (!chatState.chats[chatId]) {
    chatState.chats[chatId] = {
      id: chatId,
      contact_id: contactId,
      opened: true,
      messages: [],
    };
  }
  return chatState.chats[chatId];
}

function ensureFriendRequest(chatState, requestId, contactId = "") {
  if (!chatState.friendRequests[requestId]) {
    chatState.friendRequests[requestId] = {
      id: requestId,
      contact_id: contactId,
      accepted: false,
      created_at: new Date().toISOString(),
    };
  }
  return chatState.friendRequests[requestId];
}

function upsertChatMessage(chat, payload) {
  const exists = chat.messages.some((message) => message.id === payload.message_id);
  if (exists) {
    return;
  }
  chat.messages.push({
    id: payload.message_id,
    chat_id: payload.chat_id,
    sender_contact_id: payload.sender_contact_id,
    text: payload.text,
    created_at: new Date().toISOString(),
    links: payload.links ?? [],
  });
}

export function applyChatEvent(chatState, event) {
  if (event.kind === "chat.message") {
    const chat = ensureChat(chatState, event.payload.chat_id);
    upsertChatMessage(chat, event.payload);
    return;
  }

  if (event.kind === "chat.friend_request.accepted") {
    const request = ensureFriendRequest(
      chatState,
      event.payload.request_id,
      event.payload.contact_id,
    );
    request.accepted = true;
    request.accepted_at = new Date().toISOString();
    const chat = ensureChat(chatState, event.payload.chat_id, event.payload.contact_id);
    chat.opened = true;
  }
}

export function applyChatEvents(chatState, events) {
  events.forEach((event) => applyChatEvent(chatState, event));
}

export function connectEventStream({
  baseUrl,
  token,
  afterSeq = 0,
  chatState,
  onEvents,
}) {
  const wsBase = baseUrl.replace(/^http/, "ws");
  const socket = new WebSocket(
    `${wsBase}/ws?token=${encodeURIComponent(token)}&after_seq=${afterSeq}`,
  );

  socket.addEventListener("message", (message) => {
    const payload = JSON.parse(message.data);
    if (payload.type !== "events") {
      return;
    }
    applyChatEvents(chatState, payload.items ?? []);
    if (onEvents) {
      onEvents(payload.items ?? [], chatState);
    }
  });

  return socket;
}
