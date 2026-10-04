<script setup>
import { computed, ref, watch } from 'vue';

import FishMark from '../components/FishMark.vue';
import { boat, boatError, resetBoat, PORTS, VESSEL_TYPES, METHODS } from '../lib/boat.js';
import { forgetPhone, phoneSaved, rememberPhone } from '../lib/phone.js';

// Orders placed on the sample store, kept on the server.
const ORDER_STATUSES = [
  { key: 'new', label: 'Waiting confirmation' },
  { key: 'new', label: 'Confirmed' },
  { key: 'shipped', label: 'Shipped' },
];
const shopOrders = ref([]);
// Celebrate the first order, once.
const firstBite = ref(false);
const confetti = Array.from({ length: 28 }, (_, i) => ({
  left: `${(i * 37) % 100}%`,
  delay: `${((i * 13) % 10) / 10}s`,
  dur: `${2.4 + ((i * 7) % 12) / 10}s`,
  color: ['#f2b93b', '#0f204b', '#e0715a', '#8cc4bc', '#9db7d8'][i % 5],
  rot: `${(i * 53) % 360}deg`,
}));
const loadOrders = async () => {
  try {
    const res = await fetch('/api/shop-orders');
    if (res.ok) shopOrders.value = await res.json();
  } catch { /* server offline */ }
  if (shopOrders.value.length && !localStorage.getItem('deckhand-first-bite')) {
    localStorage.setItem('deckhand-first-bite', '1');
    firstBite.value = true;
    setTimeout(() => { firstBite.value = false; }, 5000);
  }
};
loadOrders();
const setStatus = async (o, status) => {
  const res = await fetch(`/api/shop-orders/${o.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
  if (res.ok) o.status = status;
};
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
// Opens a printable label. The sample store doesn't collect a street address yet.
const printLabel = (o) => {
  const w = window.open('', '_blank', 'width=520,height=640');
  if (!w) return;
  w.document.write(`<!doctype html><title>Label ${esc(o.id)}</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px}.l{border:3px solid #000;padding:20px;width:4in}h1{margin:0 0 4px;font-size:14px;letter-spacing:.1em}.to{font-size:22px;font-weight:700;margin:18px 0 4px}.m{font-size:14px;margin:2px 0}.f{border-top:2px dashed #000;margin-top:16px;padding-top:10px;font-size:13px}</style><div class="l"><h1>PERISHABLE - KEEP FROZEN</h1><p class="m">From: Off the Rock, Kodiak, AK</p><p class="to">${esc(o.name)}</p><p class="m">${esc(o.email)}</p><p class="m">[Street address, city, state ZIP]</p><div class="f">Order ${esc(o.id)}<br>${esc(o.lbs)} lb ${esc(o.item)}</div></div><script>window.onload=()=>window.print()<\/script>`);
  w.document.close();
};
const declineOrder = async (o) => {
  if (!window.confirm(`Decline order ${o.id} from ${o.name}? It will be deleted.`)) return;
  const res = await fetch(`/api/shop-orders/${o.id}`, { method: 'DELETE' });
  if (res.ok) shopOrders.value = shopOrders.value.filter((x) => x.id !== o.id);
};
const statusLabel = (o) => ORDER_STATUSES.find((s) => s.key === o.status)?.label || o.status;

// Deckhand drafts the message; the fisherman edits it and sends.
const contacting = ref(null);
const msgDraft = ref('');
const contactOrder = (o) => {
  contacting.value = o;
  msgDraft.value = `Hi ${o.name.split(' ')[0]}, thanks for your order of ${o.lbs} lb ${o.item} (${o.id}). It's ${o.status === 'new' ? 'on my list and I will start packing soon' : statusLabel(o).toLowerCase()}. Let me know if you have any questions.`;
};
const sendDraft = () => {
  const o = contacting.value;
  window.location.href = `mailto:${o.email}?subject=${encodeURIComponent(`Your order ${o.id}`)}&body=${encodeURIComponent(msgDraft.value)}`;
  contacting.value = null;
};

const boatMsg = ref('');
const connectBoat = () => {
  boatMsg.value = boatError();
  if (!boatMsg.value) boat.connected = true;
};

// The signed-in area: a left rail with one page per section.
const sections = [
  { key: 'orders', label: 'My orders', title: 'Orders', text: 'Orders from your buyers will show up here, with labels and packing slips ready to print.', empty: 'No bites yet.' },
  { key: 'brand', label: 'My brand', title: 'Brand', text: 'Your boat, your story and your voice.', empty: 'Nothing on the line yet. Tell us about your boat.' },
  { key: 'inventory', label: 'My inventory', title: 'Inventory', text: 'Tell us what you have' },
  { key: 'website', label: 'My website', title: 'Website', text: 'You don\'t need to edit this or think about it. That\'s our job. We show it here so you can see it.', empty: 'Your storefront is still in the net. Check back soon.' },
];

// Inventory: say or type what you have, confirm it, and it is added. Rows stay editable by hand.
const INV_KEY = 'deckhand-inventory';
const inventory = ref((() => {
  try { return JSON.parse(localStorage.getItem(INV_KEY)) || []; } catch { return []; }
})());
watch(inventory, () => localStorage.setItem(INV_KEY, JSON.stringify(inventory.value)), { deep: true });

// Mongo is the source of truth for the storefront. Hand edits to a row sync quietly, without firing the webhook.
const rowsForServer = () => inventory.value.filter((r) => r.name).map((r) => ({ name: r.name, lbs: r.lbs, price: r.price }));
const postInventory = (body) => fetch('/api/inventory', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => {});
let syncTimer;
watch(inventory, () => {
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => { const items = rowsForServer(); if (items.length) postInventory({ items, webhook: false }); }, 250);
}, { deep: true });
// On load, show what the server holds. If it is empty, send up what this browser already has.
(async () => {
  try {
    const res = await fetch('/api/inventory');
    if (!res.ok) return;
    const rows = await res.json();
    if (rows.length) inventory.value = rows.map((r) => ({ name: r.name, lbs: r.lbs ?? '', price: r.price ?? '' }));
    else if (inventory.value.length) postInventory({ items: rowsForServer(), webhook: false });
  } catch { /* server offline */ }
})();

// Order alerts: the number is held for this browser session only (see lib/phone.js).
const phone = ref('');
const phoneError = ref('');
function savePhone() {
  const digits = phone.value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (digits.length !== 10) {
    phoneError.value = 'Enter a 10-digit mobile number.';
    return;
  }
  phoneError.value = '';
  rememberPhone(`(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`);
  phone.value = '';
}

const invText = ref('');
// Common options on other independent fishermen's direct-sale sites (Alaska DF&G seller list, Thunder's Catch, Emerald Isle, Kodiak Rush).
const speciesOptions = ['King salmon', 'Sockeye', 'Coho', 'Pink salmon', 'Chum', 'Halibut', 'Black cod', 'Pacific cod', 'Rockfish', 'Lingcod', 'Spot prawns', 'Dungeness crab', 'King crab'];
const formOptions = ['Whole', 'Fillets', 'Portions', 'Smoked', 'Canned'];
function addToText(word) {
  invText.value = `${invText.value}${invText.value && !/[,\s]$/.test(invText.value) ? ', ' : ''}${word} `;
}
const pending = ref(null);
const listening = ref(false);
const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;

// Speech often mishears or shortens names, so map what was said onto the common species list.
const speciesAliases = [
  [/\b(king|chinook|spring)\b/, 'King salmon'],
  [/\b(sockeye|red salmon|reds?)\b/, 'Sockeye'],
  [/\b(coho|silver|cohoe|koho)\b/, 'Coho'],
  [/\b(pink|humpy|humpies)\b/, 'Pink salmon'],
  [/\b(chum|dog salmon|keta)\b/, 'Chum'],
  [/\b(halibut|hali but|flatfish)\b/, 'Halibut'],
  [/\b(black cod|sablefish|sable)\b/, 'Black cod'],
  [/\b(pacific cod|p cod|true cod)\b/, 'Pacific cod'],
  [/\b(lingcod|ling cod|ling)\b/, 'Lingcod'],
  [/\b(rockfish|rock fish|snapper)\b/, 'Rockfish'],
  [/\b(spot prawns?|prawns?|shrimp)\b/, 'Spot prawns'],
  [/\b(dungeness|dungie|dungeoness)\b/, 'Dungeness crab'],
  [/\b(king crab|red king)\b/, 'King crab'],
];
function editDistance(a, b) {
  const d = Array.from({ length: a.length + 1 }, (_, i) => [i]);
  for (let j = 1; j <= b.length; j++) d[0][j] = j;
  for (let i = 1; i <= a.length; i++) for (let j = 1; j <= b.length; j++) d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
  return d[a.length][b.length];
}
function matchSpecies(name) {
  const n = name.toLowerCase();
  if (/\bking\b/.test(n) && /\bcrab\b/.test(n)) return 'King crab';
  if (/\bblack\b/.test(n) && /\bcod\b/.test(n)) return 'Black cod';
  if (/\bpacific\b/.test(n) && /\bcod\b/.test(n)) return 'Pacific cod';
  const hit = speciesAliases.find(([re]) => re.test(n));
  if (hit) return hit[1];
  let best = null;
  let bestScore = Infinity;
  for (const opt of speciesOptions) {
    const o = opt.toLowerCase();
    const score = Math.min(editDistance(n, o), ...o.split(' ').map((w) => editDistance(n, w)));
    if (score < bestScore) { bestScore = score; best = opt; }
  }
  return best && bestScore <= Math.max(2, Math.floor(n.length / 4)) ? best : null;
}

// Rough rule-based parse, e.g. "200 lbs king salmon at 14, 50 pounds of halibut for $18". A placeholder for a real model.
function parseInventory(text) {
  return text
    .split(/,|;|\n|\band\b/i)
    .map((chunk) => {
      const c = chunk.trim();
      const lbs = c.match(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)\b/i) || c.match(/^(\d+(?:\.\d+)?)\s+(?=[a-z])/i);
      const price = c.match(/(?:at|for|@)\s*\$?\s*(\d+(?:\.\d+)?)/i) || c.match(/\$\s*(\d+(?:\.\d+)?)/);
      const heard = c
        .replace(/(\d+(?:\.\d+)?)\s*(?:lbs?|pounds?)\b/i, '')
        .replace(/(?:at|for|@)?\s*\$?\s*\d+(?:\.\d+)?\s*(?:dollars?)?\s*(?:a|per|\/)?\s*(?:lb|pound)?s?\s*$/i, '')
        .replace(/^\s*\d+(?:\.\d+)?\s+/, '')
        .replace(/\b(of|i have|i've got|got|have|some)\b/gi, '')
        .replace(/[^a-z \-]/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
      if (!heard) return null;
      const name = matchSpecies(heard) || heard.charAt(0).toUpperCase() + heard.slice(1);
      return { name, lbs: lbs ? lbs[1] : '', price: price ? price[1] : '' };
    })
    .filter(Boolean);
}
function review() {
  const items = parseInventory(invText.value);
  pending.value = items.length ? items : null;
  if (!items.length) invText.value = invText.value.trim();
  else {
    textCustomers.value = true;
    speakReadBack(items);
  }
}
// After "Yes, update" the line is spoken and typed out word by word, then the form comes back.
const textCustomers = ref(true);
const confirmLine = ref('');
const confirmed = ref(false);
const confirmShown = ref('');
let confirmTimers = [];
function clearConfirm() { confirmTimers.forEach(clearTimeout); confirmTimers = []; }
function showConfirmation() {
  clearConfirm();
  confirmed.value = true;
  confirmShown.value = '';
  confirmLine.value = textCustomers.value ? "Got it, we'll let your customers know." : 'Got it, your inventory is updated.';
  speak(confirmLine.value);
  const words = confirmLine.value.split(' ');
  words.forEach((_, i) => {
    confirmTimers.push(setTimeout(() => { confirmShown.value = words.slice(0, i + 1).join(' '); }, i * 320));
  });
  confirmTimers.push(setTimeout(() => { confirmed.value = false; }, words.length * 320 + 1600));
}
function confirmInventory() {
  stopReadBack();
  for (const item of pending.value) {
    const row = inventory.value.find((r) => r.name.toLowerCase() === item.name.toLowerCase());
    if (row) {
      if (item.lbs) row.lbs = item.lbs;
      if (item.price) row.price = item.price;
    } else inventory.value.push({ ...item });
  }
  const added = pending.value.map((p) => ({ name: p.name, lbs: p.lbs, price: p.price }));
  // Saved on the server, which fires the inventory webhook. The dashboard still works if the server is offline.
  fetch('/api/inventory', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: added, notifyCustomers: textCustomers.value }),
  }).catch(() => {});
  pending.value = null;
  invText.value = '';
  showConfirmation();
}
function removeRow(i) {
  const [gone] = inventory.value.splice(i, 1);
  if (gone) fetch(`/api/inventory/${encodeURIComponent(gone.name)}`, { method: 'DELETE' }).catch(() => {});
}
// "Not quite" throws the read-back away and reopens the mic so the seller can say it again.
function cancelInventory() {
  stopReadBack();
  pending.value = null;
  invText.value = '';
  listen();
}
const micError = ref('');
let recognizer = null;

// Prototype: simulate the mic with a canned phrase so the flow works without a microphone.
// Real speech recognition is used where the browser has it; the mock is only the fallback.
const MOCK_VOICE = !SpeechRec;
const voiceAvailable = MOCK_VOICE || !!SpeechRec;
const mockPhrases = [
  '200 lbs king salmon at 14, 50 lbs halibut at 18',
  '80 lbs coho at 11 and 30 lbs black cod at 22',
  '120 lbs sockeye at 13, 40 lbs lingcod at 9',
];
let mockRound = 0;
let mockTimers = [];
function clearMock() { mockTimers.forEach(clearTimeout); mockTimers = []; }
function finishMock() {
  clearMock();
  listening.value = false;
  review();
}
function mockListen() {
  const words = mockPhrases[mockRound++ % mockPhrases.length].split(' ');
  listening.value = true;
  invText.value = '';
  words.forEach((_, i) => {
    mockTimers.push(setTimeout(() => { invText.value = words.slice(0, i + 1).join(' '); }, 700 + i * 180));
  });
  mockTimers.push(setTimeout(finishMock, 700 + words.length * 180 + 600));
}

// Read the parsed items back out loud as well as on screen.
function readBackText(items) {
  const parts = items.map((p) => `${p.lbs ? `${p.lbs} pounds of ` : ''}${p.name.toLowerCase()}${p.price ? ` at ${p.price} dollars a pound` : ''}`);
  return `Did we get this right? ${parts.join(', and ')}.`;
}
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(new SpeechSynthesisUtterance(text));
}
function speakReadBack(items) { speak(readBackText(items)); }
function stopReadBack() { if ('speechSynthesis' in window) window.speechSynthesis.cancel(); }

// Tap once to start, tap again to stop. When speech ends, the read-back appears on its own.
function listen() {
  if (!voiceAvailable) return;
  if (listening.value) {
    if (MOCK_VOICE) finishMock();
    else if (recognizer) recognizer.stop();
    return;
  }
  micError.value = '';
  if (MOCK_VOICE) { mockListen(); return; }
  const base = invText.value.trim();
  let heard = '';
  const rec = new SpeechRec();
  recognizer = rec;
  rec.lang = 'en-US';
  rec.interimResults = true;
  rec.continuous = true;
  rec.onstart = () => { listening.value = true; };
  rec.onresult = (e) => {
    heard = Array.from(e.results).map((r) => r[0].transcript).join(' ').trim();
    invText.value = `${base} ${heard}`.trim();
  };
  rec.onerror = (e) => {
    if (e.error === 'not-allowed' || e.error === 'service-not-allowed') micError.value = 'Microphone access is blocked. Allow it in your browser, or type below.';
    else if (e.error === 'no-speech') micError.value = "We didn't hear anything. Tap the button and try again.";
    else if (e.error !== 'aborted') micError.value = 'Something went wrong with the microphone. You can type instead.';
  };
  rec.onend = () => {
    listening.value = false;
    recognizer = null;
    if (heard && !micError.value) review();
  };
  rec.start();
}

// Website: no direct editing. Changes are requested in words and our team makes them.
const FB_KEY = 'deckhand-site-feedback';
const feedback = ref((() => {
  try { return JSON.parse(localStorage.getItem(FB_KEY)) || []; } catch { return []; }
})());
const feedbackDraft = ref('');
function sendFeedback() {
  const t = feedbackDraft.value.trim();
  if (!t) return;
  feedback.value.unshift(t);
  feedbackDraft.value = '';
  localStorage.setItem(FB_KEY, JSON.stringify(feedback.value));
}

const defaultPosts = [
  ['Mon', 'Fresh off the Alaska Beauty: wild coho, pulled this morning. Order direct and it ships tomorrow.'],
  ['Wed', 'Meet the crew behind your dinner. 24 hours on the water, 0 middlemen.'],
  ['Fri', 'Last call for this week\'s catch. Tap the link, we handle the rest.'],
];

// Front-end only for now: nothing is sent anywhere yet.
const questions = [
  'Tell me about the first time you ever went fishing. Where were you, and who was with you?',
  'What is the biggest fish you ever caught?',
  'How do you like to cook your catch?',
  'What is the name of your business?',
];

const STORE_KEY = 'deckhand-brand-v3';
const saved = (() => {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
})();
const answers = ref(questions.map((_, i) => (saved.answers && saved.answers[i]) || ''));
const notes = ref(Array.isArray(saved.notes) ? saved.notes : []);
const isDev = import.meta.env.DEV;
const noteDraft = ref('');
const draft = ref('');

// Index of the next unanswered question; equals questions.length when done.
const step = computed(() => {
  const i = answers.value.findIndex((a) => !a.trim());
  return i === -1 ? questions.length : i;
});
const done = computed(() => step.value === questions.length);

// The welcome overlay answers one question at a time; the answer lands in the profile form.
function send() {
  const text = draft.value.trim();
  if (!text || done.value) return;
  answers.value[step.value] = text;
  draft.value = '';
  if (done.value && welcome.value) {
    path.value = '/app/brand';
    window.history.pushState({}, '', path.value);
  }
}

function addNote() {
  const text = noteDraft.value.trim();
  if (!text) return;
  notes.value.push(text);
  noteDraft.value = '';
}

// A rough, rule-based read of the answers. A placeholder until a real model is wired in.
const tone = computed(() => {
  if (!done.value) return null;
  const text = answers.value.join(' ');
  const words = text.split(/\s+/).filter(Boolean).length;
  const avg = words / answers.value.length;
  const traits = [];
  traits.push(avg < 12 ? 'Straight to the point' : avg < 40 ? 'Conversational' : 'Storyteller');
  if (/!/.test(text)) traits.push('Enthusiastic');
  if (/\d/.test(text)) traits.push('Down to the details');
  if (/\b(butter|garlic|lemon|grill|smok|bake|fry|salt|pepper|dill)\w*/i.test(text)) traits.push('Hands-on in the kitchen');
  if (traits.length < 3) traits.push('Genuine');
  return {
    traits,
    sample: avg < 12
      ? 'Fresh catch, straight off the boat. Order direct.'
      : 'This one came over the rail this morning, and it is ready for your table. Order direct and I will pack it myself.',
  };
});

// Keep answers, notes and the derived tone in the browser so they survive a reload.
watch([answers, notes, tone], () => {
  localStorage.setItem(STORE_KEY, JSON.stringify({ answers: answers.value, notes: notes.value, tone: tone.value }));
}, { deep: true });

// Captions are written as plain posts. They only use safe details (business name, what is in inventory),
// because pasting raw answers into templates reads badly. A real model would use the full answers.
const posts = computed(() => {
  if (!tone.value) return defaultPosts;
  const biz = answers.value[3];
  const fish = (inventory.value[0] && inventory.value[0].name.toLowerCase()) || 'salmon';
  const bang = tone.value.traits.includes('Enthusiastic') ? '!' : '.';
  return [
    ['Mon', `Fresh ${fish} this week from ${biz}. We pulled it in ourselves and froze it within hours. Order direct and it ships to your door${bang}`],
    ['Wed', `Early start at ${biz}. Cold hands, good fish.${bang}`],
    ['Fri', `Last call for this week's ${fish}. Order by tonight and we'll pack it at sunrise${bang}`],
  ];
});

// Show a short "generating" state whenever the full set of answers is completed or changed.
const generating = ref(false);
let genTimer;
watch(() => (done.value ? answers.value.join('\u0000') : ''), (now, before) => {
  if (!now || now === before) return;
  generating.value = true;
  clearTimeout(genTimer);
  genTimer = setTimeout(() => { generating.value = false; }, 2200);
});

function clearAnswers() {
  clearTimeout(genTimer);
  generating.value = false;
  localStorage.removeItem(STORE_KEY);
  answers.value = questions.map(() => '');
  notes.value = [];
  noteDraft.value = '';
  draft.value = '';
}

// Fade in only when arriving from the landing page, not when switching tabs.
const arriving = sessionStorage.getItem('deckhand-enter') === '1';
sessionStorage.removeItem('deckhand-enter');

// The welcome modal opens on arrival and closes when the questions are answered or skipped.
const welcome = ref(arriving);
const showWelcome = computed(() => welcome.value && !done.value);
const skip = () => { welcome.value = false; };
window.addEventListener('keydown', (e) => { if (e.key === 'Escape') skip(); });

// Tabs switch in place (and update the address bar) so there is no page reload.
const path = ref(window.location.pathname.replace(/\/$/, ''));
const current = computed(() => sections.find((s) => path.value === `/app/${s.key}`) || sections[0]);

function go(event, s) {
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  path.value = `/app/${s.key}`;
  window.history.pushState({}, '', path.value);
}

window.addEventListener('popstate', () => {
  path.value = window.location.pathname.replace(/\/$/, '');
});
</script>

<template>
  <div class="dash" :class="{ 'dash--arriving': arriving }">
    <aside class="dash__rail">
      <a class="dash__logo" href="/">
        <FishMark class="dash__mark" />
        <span>DECKHAND</span>
      </a>
      <nav aria-label="Dashboard">
        <a
          v-for="s in sections"
          :key="s.key"
          :href="`/app/${s.key}`"
          @click="go($event, s)"
          :class="{ 'is-active': s.key === current.key }"
          :aria-current="s.key === current.key ? 'page' : undefined"
        >{{ s.label }}</a>
      </nav>
    </aside>

    <main class="dash__main">
      <h1>{{ current.title }}</h1>
      <p :class="{ dash__lead: current.key === 'website' }">{{ current.text }}</p>
      <template v-if="current.key === 'brand'">
        <section class="brand__card brand__profile">
          <h2>Tell us about you</h2>
          <p class="brand__note">A few details help us tell your story to buyers. Your answers save automatically.</p>
          <button v-if="isDev" type="button" class="dev__clear" @click="clearAnswers">Clear answers (dev)</button>
          <form class="brand__profile-form" @submit.prevent>
            <label v-for="(q, i) in questions" :key="i" class="brand__profile-field">
              <span>{{ q }}</span>
              <input v-model="answers[i]" type="text" :autocomplete="i === questions.length - 1 ? 'organization' : 'off'" />
            </label>
          </form>
          <div class="brand__extra">
            <h3>Anything else you'd like to share?</h3>
            <ul v-if="notes.length" class="brand__notes">
              <li v-for="(n, i) in notes" :key="i">{{ n }}</li>
            </ul>
            <form class="brand__notes-form" @submit.prevent="addNote">
              <label for="brand-note">Add details about your business</label>
              <div class="brand__notes-row">
                <input id="brand-note" v-model="noteDraft" type="text" placeholder="Share anything else you'd like buyers to know" />
                <button type="submit">Add detail</button>
              </div>
            </form>
          </div>
        </section>

        <section v-if="tone" class="brand__card brand__tone">
          <h2>Your brand voice</h2>
          <p v-if="generating" class="tone__loading" role="status">Generating your brand voice<span class="tone__dots" aria-hidden="true"><i></i><i></i><i></i></span></p>
          <template v-else>
            <p class="brand__note">Drafted from your answers. Edit an answer above and this updates.</p>
            <ul class="tone__traits">
              <li v-for="(t, i) in tone.traits" :key="t" :style="{ animationDelay: `${i * 0.12}s` }">{{ t }}</li>
            </ul>
            <p class="tone__sample">&ldquo;{{ tone.sample }}&rdquo;</p>
          </template>
        </section>

        <section class="brand__card">
          <h2>Recent reels</h2>
          <p class="brand__note">A sample reel from our social media package.</p>
          <video class="brand__reel" controls playsinline preload="metadata" poster="/media/brand-sample-poster.jpg" src="/media/brand-sample.mp4" aria-label="Sample brand video: my favorite recipe"></video>
        </section>

        <section class="brand__card">
          <h2>Scheduled posts</h2>
          <p class="brand__note">{{ tone ? 'Drafted in your voice from your answers.' : 'Sample captions, written in your voice once you answer the questions above.' }}</p>
          <ul class="brand__posts">
            <li v-for="[day, text] in posts" :key="day"><span>{{ day }}</span>{{ text }}</li>
          </ul>
        </section>

        <section class="brand__card brand__powered">
          <strong>Powered by Metricool &amp; Humans</strong>
          <span>Deckhand offers a social media package. Behind the scenes, we use <a href="https://metricool.com/" target="_blank" rel="noopener">Metricool</a> and a real person to plan, schedule and publish content for you.</span>
        </section>
      </template>
      <template v-if="current.key === 'inventory'">
        <section class="brand__card inv">
          <h2>What did you catch?</h2>
          <p class="brand__note">Tap the button and say it, like "200 lbs king salmon at 14, 50 lbs halibut at 18". We'll read it back before anything changes.</p>
          <div v-if="confirmed" class="inv__done" role="status">
            <span class="inv__done-mark" aria-hidden="true">&#10003;</span>
            <p>{{ confirmShown }}</p>
          </div>
          <form v-else-if="!pending" class="inv__say" @submit.prevent="review">
            <div v-if="voiceAvailable" class="inv__voice">
              <button type="button" class="inv__record" :class="{ 'is-on': listening }" :aria-pressed="listening" :aria-label="listening ? 'Stop listening' : 'Start listening'" @click="listen">
                <svg v-if="!listening" viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="2" width="6" height="12" rx="3" /><path d="M5 11a7 7 0 0 0 14 0" /><path d="M12 18v4" /></svg>
                <svg v-else viewBox="0 0 24 24" width="32" height="32" fill="currentColor" aria-hidden="true"><rect x="6" y="6" width="12" height="12" rx="2" /></svg>
              </button>
              <p class="inv__voice-label" role="status">{{ listening ? 'Listening... tap when you are done' : 'Tap to speak' }}</p>
              <p v-if="micError" class="inv__voice-error" role="alert">{{ micError }}</p>
            </div>
            <p v-else class="brand__note">Your browser can't listen, so type what you have instead.</p>
            <label class="inv__label" for="inv-text">{{ voiceAvailable ? 'Or type it' : 'What do you have today?' }}</label>
            <textarea id="inv-text" v-model="invText" rows="3" placeholder="What do you have today?" @keydown.enter.exact.prevent="review"></textarea>
            <p class="inv__label">Commonly sold</p>
            <div class="inv__chips">
              <button v-for="s in speciesOptions" :key="s" type="button" @click="addToText(s)">{{ s }}</button>
            </div>
            <p class="inv__label">Product form</p>
            <div class="inv__chips">
              <button v-for="f in formOptions" :key="f" type="button" @click="addToText(f.toLowerCase())">{{ f }}</button>
            </div>
            <div class="inv__actions">
              <button type="submit" class="inv__go">Review</button>
            </div>
          </form>
          <div v-else class="inv__confirm" role="status">
            <p>Did we get this right?</p>
            <ul>
              <li v-for="(p, i) in pending" :key="i"><strong>{{ p.name }}</strong> {{ p.lbs ? `${p.lbs} lbs` : 'amount not given' }}{{ p.price ? `, $${p.price}/lb` : '' }}</li>
            </ul>
            <label class="inv__notify">
              <input v-model="textCustomers" type="checkbox" />
              <span>Text my customers</span>
            </label>
            <div class="inv__actions">
              <button type="button" class="inv__mic" @click="cancelInventory">Not quite, say it again</button>
              <button type="button" class="inv__go" @click="confirmInventory">Yes, update</button>
            </div>
          </div>
          <ul v-if="inventory.length" class="inv__rows">
            <li v-for="(r, i) in inventory" :key="r.name">
              <strong>{{ r.name }}</strong>
              <label><input v-model="r.lbs" type="number" min="0" inputmode="decimal" placeholder="0" aria-label="Pounds available" /> lbs</label>
              <label>$ <input v-model="r.price" type="number" min="0" step="0.01" inputmode="decimal" placeholder="0.00" aria-label="Price per pound" /> /lb</label>
              <button class="chat__pencil" type="button" aria-label="Remove" @click="removeRow(i)">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
              </button>
            </li>
          </ul>
          <p v-else class="brand__note">Nothing listed yet.</p>
        </section>
        <section class="brand__card boat">
          <h2>Connect your boat</h2>
          <p class="brand__note">Customers see where their fish is and when it will be packaged. Your location is only shared with people who bought from you.</p>
          <div v-if="boat.connected" class="boat__on">
            <p>{{ boat.name }} is connected through {{ METHODS.find((m) => m.key === boat.method).label }}.</p>
            <button type="button" class="boat__btn" @click="resetBoat">Disconnect</button>
          </div>
          <form v-else class="boat__form" @submit.prevent="connectBoat">
            <label>Boat name<input v-model="boat.name" type="text" placeholder="F/V Sea Star" /></label>
            <label>Vessel type
              <select v-model="boat.type"><option value="" disabled>Choose one</option><option v-for="t in VESSEL_TYPES" :key="t">{{ t }}</option></select>
            </label>
            <label>Registration number<input v-model="boat.registration" type="text" placeholder="Coast Guard or state number" /></label>
            <label>Home port
              <select v-model="boat.port"><option v-for="p in PORTS" :key="p.name">{{ p.name }}</option></select>
            </label>
            <label>How do we track it?
              <select v-model="boat.method"><option v-for="m in METHODS" :key="m.key" :value="m.key">{{ m.label }}</option></select>
            </label>
            <label>{{ METHODS.find((m) => m.key === boat.method).field }}
              <input v-model="boat.id" type="text" />
              <small>{{ METHODS.find((m) => m.key === boat.method).hint }}</small>
            </label>
            <label>Location detail
              <select v-model="boat.precision"><option value="approx">Approximate (nearest 10 miles)</option><option value="exact">Exact position</option></select>
            </label>
            <label class="boat__check"><input v-model="boat.consent" type="checkbox" /> I agree to share my boat's location with my customers.</label>
            <p v-if="boatMsg" class="boat__err">{{ boatMsg }}</p>
            <button type="submit" class="boat__btn">Connect boat</button>
          </form>
        </section>
      </template>
      <template v-if="current.key === 'website'">
        <section class="brand__card site__preview">
          <div class="site__head">
            <div>
              <h2>Off the Rock</h2>
              <p class="brand__note">{{ done ? 'Your brand is ready. Your storefront is being built from it. This is a preview.' : 'A preview of your storefront. It will be built from your brand once you tell us about you.' }}</p>
            </div>
            <a class="site__open" href="/example" target="_blank" rel="noopener">Open full page</a>
          </div>
          <div class="site__frame">
            <iframe src="/example" title="Preview of the Off the Rock storefront" loading="lazy"></iframe>
          </div>
        </section>
        <section class="brand__card">
          <h2>Want something changed?</h2>
          <p class="brand__note">You don't edit the site yourself. Tell us what you'd like different and our team will make it happen.</p>
          <form class="chat__form" @submit.prevent="sendFeedback">
            <input v-model="feedbackDraft" type="text" placeholder="e.g. Make the photos bigger, add my boat's story..." aria-label="Website feedback" />
            <button type="submit">Send</button>
          </form>
          <ul v-if="feedback.length" class="inv__sent">
            <li v-for="(f, i) in feedback" :key="i">{{ f }}<span>Sent to the team</span></li>
          </ul>
        </section>
      </template>
      <template v-if="current.key === 'orders'">
        <section class="brand__card">
          <h2>Get a text when an order comes in</h2>
          <p class="brand__note">Enter your mobile number and we'll text you each time someone orders from Off the Rock while Deckhand is open in this browser.</p>
          <form v-if="!phoneSaved" class="chat__form" @submit.prevent="savePhone">
            <input v-model="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 123-4567" aria-label="Mobile phone number" />
            <button type="submit">Save</button>
          </form>
          <p v-else class="orders__phone">Texts go to <strong>{{ phoneSaved }}</strong> <button type="button" class="orders__change" @click="forgetPhone">Change</button></p>
          <p v-if="phoneError" class="orders__error" role="alert">{{ phoneError }}</p>
          <p class="orders__fine">We use your number only for these order texts, and we forget it when you close your browser. By saving it you agree to get order alert texts from Deckhand: a confirmation now, then one for each order. Message and data rates may apply. Reply STOP to stop or HELP for help. <a href="/terms">Terms</a> and           <a href="/privacy">Privacy</a>.</p>        </section>
      </template>
      <template v-if="current.key === 'orders' && shopOrders.length">
        <ul class="ord">
          <li v-for="o in shopOrders" :key="o.id" class="ord__item">
            <div class="ord__main">
              <strong>{{ o.name }}</strong>
              <span>{{ o.lbs }} lb {{ o.item }}</span>
              <small>{{ o.id }} &middot; ${{ Number(o.total).toFixed(2) }}</small>
            </div>
            <div class="ord__actions">
              <select class="ord__status" :class="`is-${o.status}`" :value="o.status" aria-label="Order status" @change="setStatus(o, $event.target.value)">
                <option v-for="s in ORDER_STATUSES" :key="s.key" :value="s.key">{{ s.label }}</option>
              </select>
              <button type="button" class="ord__print" @click="printLabel(o)">Print postage label</button>
              <button type="button" class="ord__link" @click="contactOrder(o)">Contact</button>
              <button type="button" class="ord__decline" @click="declineOrder(o)">Decline</button>
            </div>
          </li>
        </ul>
      </template>
      <div v-if="current.key === 'orders' && !shopOrders.length" class="dash__empty">
        <FishMark class="dash__swimmer" lively body="#0f204b" accent="#f2b93b" ground="#f4f1ea" />
        <p>{{ current.empty }}</p>
      </div>
    </main>

    <div v-if="firstBite" class="bite" aria-live="polite">
      <i v-for="(c, n) in confetti" :key="n" :style="{ left: c.left, animationDelay: c.delay, animationDuration: c.dur, background: c.color, '--rot': c.rot }"></i>
      <p>Your first bite!</p>
    </div>

    <div v-if="contacting" class="ord__modal" role="dialog" aria-modal="true" aria-label="Message the buyer">
      <form class="ord__card" @submit.prevent="sendDraft">
        <h2>Message {{ contacting.name }}</h2>
        <p class="ord__hint">Deckhand drafted this for you. Change anything you like.</p>
        <textarea v-model="msgDraft" rows="6" aria-label="Message"></textarea>
        <div class="ord__row">
          <button type="button" class="ord__link" @click="contacting = null">Cancel</button>
          <button type="submit" class="boat__btn">Open in email</button>
        </div>
      </form>
    </div>

    <div v-if="showWelcome" class="welcome" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
      <form class="welcome__card" @submit.prevent="send">
        <FishMark class="welcome__mark" />
        <p class="welcome__step">Question {{ step + 1 }} of {{ questions.length }}</p>
        <h2 id="welcome-title">{{ questions[step] }}</h2>
        <textarea v-model="draft" rows="4" placeholder="Type your answer..." aria-label="Your answer" autofocus @keydown.enter.exact.prevent="send"></textarea>
        <div class="welcome__actions">
          <button type="button" class="welcome__skip" @click="skip">Skip for now</button>
          <button type="submit" class="welcome__next">{{ step === questions.length - 1 ? 'Finish' : 'Next' }}</button>
        </div>
      </form>
    </div>
  </div>
</template>
