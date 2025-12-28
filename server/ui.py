from __future__ import annotations

from fastapi import APIRouter
from fastapi.responses import HTMLResponse

router = APIRouter()


HOST_UI_HTML = """<!doctype html>
<html lang=\"ru\">
  <head>
    <meta charset=\"utf-8\" />
    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1\" />
    <title>Aether Journal Host</title>
    <style>
      body {
        font-family: "Segoe UI", system-ui, -apple-system, sans-serif;
        background: #0f1117;
        color: #f5f7ff;
        margin: 0;
        padding: 32px;
      }
      h1 {
        margin-bottom: 12px;
      }
      h2 {
        margin-top: 32px;
      }
      section {
        background: #171b26;
        border: 1px solid #2a3142;
        border-radius: 12px;
        padding: 20px;
        margin-bottom: 20px;
      }
      label {
        display: block;
        margin-bottom: 6px;
        font-weight: 600;
      }
      input, textarea, button {
        font-size: 14px;
      }
      input, textarea {
        width: 100%;
        padding: 8px 10px;
        border-radius: 8px;
        border: 1px solid #30374b;
        background: #0f131c;
        color: #f5f7ff;
        margin-bottom: 12px;
      }
      button {
        background: #4b74ff;
        color: white;
        border: none;
        padding: 10px 16px;
        border-radius: 8px;
        cursor: pointer;
        font-weight: 600;
      }
      button.secondary {
        background: #2a3142;
      }
      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
        gap: 16px;
      }
      .status {
        background: #0b0f18;
        border: 1px solid #30374b;
        border-radius: 8px;
        padding: 12px;
        min-height: 60px;
        white-space: pre-wrap;
      }
      .hint {
        color: #a6b0c3;
        font-size: 13px;
        margin-top: -8px;
        margin-bottom: 12px;
      }
    </style>
  </head>
  <body>
    <h1>Host UI</h1>
    <section>
      <h2>Авторизация</h2>
      <div class=\"grid\">
        <form id=\"pairing-form\">
          <label for=\"pin\">PIN для хоста</label>
          <input id=\"pin\" name=\"pin\" placeholder=\"Введите PIN\" required />
          <button type=\"submit\">Создать токен</button>
        </form>
        <form id=\"token-form\">
          <label for=\"token\">Токен хоста</label>
          <input id=\"token\" name=\"token\" placeholder=\"Вставьте host token\" required />
          <button class=\"secondary\" type=\"submit\">Сохранить токен</button>
        </form>
      </div>
      <div class=\"status\" id=\"auth-status\">Текущий токен: <span id=\"current-token\">не задан</span></div>
    </section>

    <section>
      <h2>Контакты/Чат</h2>
      <div class=\"grid\">
        <form id=\"contact-form\">
          <label for=\"contact-name\">Имя контакта</label>
          <input id=\"contact-name\" name=\"display_name\" required />
          <label for=\"contact-link\">Ссылка (JSON)</label>
          <textarea id=\"contact-link\" name=\"link_payload\" rows=\"3\" placeholder='{"type": "npc", "id": "npc_1"}'></textarea>
          <button type=\"submit\">Создать контакт</button>
        </form>
        <form id=\"friend-request-form\">
          <label for=\"friend-contact-id\">Contact ID для запроса дружбы</label>
          <input id=\"friend-contact-id\" name=\"contact_id\" required />
          <div class=\"hint\">Используйте ID контакта из ответа создания контакта.</div>
          <button type=\"submit\">Отправить friend-request</button>
        </form>
        <form id=\"message-form\">
          <label for=\"chat-id\">Chat ID</label>
          <input id=\"chat-id\" name=\"chat_id\" required />
          <label for=\"sender-contact-id\">Sender contact ID</label>
          <input id=\"sender-contact-id\" name=\"sender_contact_id\" required />
          <button class=\"secondary\" type=\"button\" id=\"autofill-sender\">
            Автозаполнить по чату
          </button>
          <label for=\"message-text\">Текст сообщения</label>
          <textarea id=\"message-text\" name=\"text\" rows=\"3\" required></textarea>
          <label for=\"message-links\">Ссылки (JSON)</label>
          <textarea id=\"message-links\" name=\"links\" rows=\"3\" placeholder='[{"type": "quest", "id": "quest_1"}]'></textarea>
          <div class=\"hint\">sender_contact_id должен совпадать с contact_id выбранного чата.</div>
          <button type=\"submit\">Отправить сообщение</button>
        </form>
      </div>
      <div class=\"status\" id=\"chat-status\">Ожидание действий…</div>
    </section>

    <script>
      const authStatus = document.getElementById("auth-status");
      const chatStatus = document.getElementById("chat-status");
      const currentToken = document.getElementById("current-token");

      const setStatus = (element, message) => {
        element.textContent = message;
      };

      const loadToken = () => localStorage.getItem("host_token") || "";

      const updateTokenDisplay = () => {
        const token = loadToken();
        currentToken.textContent = token || "не задан";
        const tokenInput = document.getElementById("token");
        if (token && tokenInput.value !== token) {
          tokenInput.value = token;
        }
      };

      const apiFetch = async (path, options = {}) => {
        const token = loadToken();
        const headers = Object.assign(
          {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          options.headers || {}
        );
        const response = await fetch(path, { ...options, headers });
        const data = await response.json().catch(() => ({}));
        if (!response.ok) {
          throw new Error(data.detail || `Ошибка запроса: ${response.status}`);
        }
        return data;
      };

      document.getElementById("pairing-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const pin = document.getElementById("pin").value.trim();
        if (!pin) {
          return;
        }
        setStatus(authStatus, "Создаём токен...");
        try {
          const data = await fetch("/api/host/pairing", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ pin }),
          }).then((response) => response.json());
          if (!data.host_token) {
            throw new Error("Токен не получен");
          }
          localStorage.setItem("host_token", data.host_token);
          updateTokenDisplay();
          setStatus(authStatus, `Токен получен: ${data.host_token}`);
        } catch (error) {
          setStatus(authStatus, `Ошибка: ${error.message}`);
        }
      });

      document.getElementById("token-form").addEventListener("submit", (event) => {
        event.preventDefault();
        const token = document.getElementById("token").value.trim();
        if (!token) {
          return;
        }
        localStorage.setItem("host_token", token);
        updateTokenDisplay();
        setStatus(authStatus, "Токен сохранён.");
      });

      document.getElementById("contact-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const displayName = document.getElementById("contact-name").value.trim();
        const linkPayloadRaw = document.getElementById("contact-link").value.trim();
        if (!displayName) {
          return;
        }
        let linkPayload = {};
        if (linkPayloadRaw) {
          try {
            linkPayload = JSON.parse(linkPayloadRaw);
          } catch (error) {
            setStatus(chatStatus, "Ошибка: некорректный JSON в ссылке.");
            return;
          }
        }
        setStatus(chatStatus, "Создание контакта...");
        try {
          const data = await apiFetch("/api/host/contacts", {
            method: "POST",
            body: JSON.stringify({ display_name: displayName, link_payload: linkPayload }),
          });
          setStatus(chatStatus, `Контакт создан: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          setStatus(chatStatus, `Ошибка: ${error.message}`);
        }
      });

      document
        .getElementById("friend-request-form")
        .addEventListener("submit", async (event) => {
          event.preventDefault();
          const contactId = document.getElementById("friend-contact-id").value.trim();
          if (!contactId) {
            return;
          }
          setStatus(chatStatus, "Отправка friend-request...");
          try {
            const data = await apiFetch("/api/host/friend-requests", {
              method: "POST",
              body: JSON.stringify({ contact_id: contactId }),
            });
            setStatus(chatStatus, `Friend-request отправлен: ${JSON.stringify(data, null, 2)}`);
          } catch (error) {
            setStatus(chatStatus, `Ошибка: ${error.message}`);
          }
        });

      const fetchChatContactId = async (chatId) => {
        const snapshot = await apiFetch("/api/snapshot");
        const chat = snapshot.snapshot?.chats?.[chatId];
        return chat?.contact_id || null;
      };

      document.getElementById("autofill-sender").addEventListener("click", async () => {
        const chatId = document.getElementById("chat-id").value.trim();
        if (!chatId) {
          setStatus(chatStatus, "Укажите chat_id для автозаполнения.");
          return;
        }
        try {
          const contactId = await fetchChatContactId(chatId);
          if (!contactId) {
            setStatus(chatStatus, "Чат не найден или contact_id отсутствует.");
            return;
          }
          document.getElementById("sender-contact-id").value = contactId;
          setStatus(chatStatus, `Sender contact ID обновлён: ${contactId}`);
        } catch (error) {
          setStatus(chatStatus, `Ошибка: ${error.message}`);
        }
      });

      document.getElementById("message-form").addEventListener("submit", async (event) => {
        event.preventDefault();
        const chatId = document.getElementById("chat-id").value.trim();
        const senderContactId = document
          .getElementById("sender-contact-id")
          .value.trim();
        const text = document.getElementById("message-text").value.trim();
        const linksRaw = document.getElementById("message-links").value.trim();
        if (!chatId || !senderContactId || !text) {
          return;
        }
        let links = [];
        if (linksRaw) {
          try {
            links = JSON.parse(linksRaw);
          } catch (error) {
            setStatus(chatStatus, "Ошибка: некорректный JSON в ссылках.");
            return;
          }
        }
        setStatus(chatStatus, "Проверяем соответствие sender_contact_id...");
        try {
          const contactId = await fetchChatContactId(chatId);
          if (!contactId) {
            setStatus(chatStatus, "Чат не найден. Проверьте chat_id.");
            return;
          }
          if (contactId !== senderContactId) {
            setStatus(
              chatStatus,
              `sender_contact_id должен совпадать с contact_id чата (${contactId}).`
            );
            return;
          }
          const data = await apiFetch(`/api/host/chats/${chatId}/messages`, {
            method: "POST",
            body: JSON.stringify({
              text,
              sender_contact_id: senderContactId,
              links,
            }),
          });
          setStatus(chatStatus, `Сообщение отправлено: ${JSON.stringify(data, null, 2)}`);
        } catch (error) {
          setStatus(chatStatus, `Ошибка: ${error.message}`);
        }
      });

      updateTokenDisplay();
    </script>
  </body>
</html>
"""


@router.get("/host", response_class=HTMLResponse)
def host_ui() -> HTMLResponse:
    return HTMLResponse(HOST_UI_HTML)
