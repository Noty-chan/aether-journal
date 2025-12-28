import { connectEventStream, hydrateChatState } from "../shared/events.js";

export function startPlayerEventStream({ baseUrl, token, snapshot, lastSeq, onEvents }) {
  const chatState = hydrateChatState(snapshot);
  const socket = connectEventStream({
    baseUrl,
    token,
    afterSeq: lastSeq ?? 0,
    chatState,
    onEvents,
  });

  return { chatState, socket };
}
