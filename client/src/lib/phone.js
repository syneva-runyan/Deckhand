import { ref } from 'vue';

// The number for order texts. It is kept in sessionStorage, so it is gone when the browser closes,
// and the server only holds it while a Deckhand page in this browser keeps re-sending it.
const KEY = 'deckhand-phone';

const read = () => {
  try { return sessionStorage.getItem(KEY) || ''; } catch { return ''; }
};

export const phoneSaved = ref(read());

// `confirm` asks the server to send a "you're set" message. Only a fresh save does that.
const send = (confirm = false) => fetch('/api/seller-phone', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ phone: phoneSaved.value, confirm }),
  keepalive: true,
}).catch(() => {});
const drop = () => fetch('/api/seller-phone', { method: 'DELETE', keepalive: true }).catch(() => {});

export function rememberPhone(pretty) {
  phoneSaved.value = pretty;
  try { sessionStorage.setItem(KEY, pretty); } catch { /* ignore */ }
  send(true);
}

export function forgetPhone() {
  phoneSaved.value = '';
  try { sessionStorage.removeItem(KEY); } catch { /* ignore */ }
  drop();
}

// Run once when any Deckhand page loads.
export function startPhoneSession() {
  // Earlier versions kept the number in localStorage, which outlives the browser. Clear it.
  try { localStorage.removeItem(KEY); } catch { /* ignore */ }
  if (phoneSaved.value) send();
  setInterval(() => { if (phoneSaved.value) send(); }, 60 * 1000);
  window.addEventListener('pagehide', () => { if (phoneSaved.value) drop(); });
  window.addEventListener('pageshow', (e) => { if (e.persisted && phoneSaved.value) send(); });
}
