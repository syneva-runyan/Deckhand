<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';
import FishMark from '../components/FishMark.vue';
import CheckoutModal from '../components/CheckoutModal.vue';

const buying = ref(null);
const onPaid = async (o) => {
  localStorage.setItem('deckhand-example-order', JSON.stringify(o));
  // Send the order to the fisherman's My orders page. The confirmation still works if the server is down.
  try {
    await fetch('/api/shop-orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: o.id, name: o.name, email: o.email, item: o.product.name, lbs: o.lbs, total: o.total }),
    });
  } catch { /* ignore */ }
  window.location.assign(`/example/order/${o.id.toLowerCase()}`);
};

const tabs = [
  { key: 'shop', label: 'Shop' },
  { key: 'story', label: 'Our story' },
  { key: 'social', label: 'Social' },
];
const tab = ref('shop');

// Set to a photo path (for example '/media/sara.webp') once a real portrait is in client/public/media.
const storyPhoto = '';

// Text-me-about-new-fish signup in the sticky header.
const phone = ref('');
const phoneError = ref('');
const sending = ref(false);
const subscribed = ref(false);
async function subscribe() {
  const digits = phone.value.replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (digits.length !== 10) {
    phoneError.value = 'Enter a 10-digit mobile number.';
    return;
  }
  phoneError.value = '';
  sending.value = true;
  try {
    const res = await fetch('/api/subscribers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: digits }) });
    if (!res.ok) throw new Error('failed');
    subscribed.value = true;
  } catch {
    phoneError.value = "We couldn't save that. Please try again.";
  } finally {
    sending.value = false;
  }
}

// Sample posts, standing in for a live social feed.
const feed = [
  { img: '/media/salmon.webp', alt: 'Fresh salmon', text: 'Fresh off the Hook. Pulled this morning, frozen by noon.', when: 'Mon' },
  { img: '/media/boat.webp', alt: 'Boat on the water', text: 'Another early start out of Kodiak.', when: 'Wed' },
  { img: '/media/fish.webp', alt: 'Salmon on the line', text: 'Caught on the Rock, shipped to your door.', when: 'Fri' },
];

// The shop reads the seller's inventory from the server (the Mongo `inventory` collection).
// Photos and blurbs are matched by species name, since inventory rows only hold name, pounds and price.
const looks = [
  { match: /halibut/i, img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Halibut_fillets_with_tomatoes,_peppers_and_mint_(26713896144).jpg?width=600', note: 'Cut to order, flash frozen' },
  { match: /sockeye/i, img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sockeye_salmon_fillets.png?width=600', note: 'Portioned, vacuum sealed' },
  { match: /king|chinook/i, img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Halibut_and_salmon_fillets.jpg?width=600', note: 'Skin-on, vacuum sealed, flash frozen' },
  { match: /salmon|coho|pink|chum/i, img: '/media/salmon.webp', note: 'Wild Alaskan salmon, flash frozen' },
];
const fallbackLook = { img: '/media/fish.webp', note: 'Fresh off the Hook, flash frozen' };
const inventory = ref([]);
const loaded = ref(false);
// Every item on the dock, in stock or not. Out-of-stock items stay listed but grayed out.
const catalog = ['King Salmon', 'Sockeye Salmon', 'Coho Salmon', 'Pink Salmon', 'Halibut'];
const listed = computed(() => {
  const rows = [...inventory.value];
  for (const name of catalog) {
    const key = name.split(' ')[0].toLowerCase();
    const has = rows.some((r) => r.name.toLowerCase().includes(key) || (key === 'king' && /chinook/i.test(r.name)));
    if (!has) rows.push({ name, lbs: 0, price: 0 });
  }
  return rows;
});
const products = computed(() => listed.value.map((r) => {
  const look = looks.find((l) => l.match.test(r.name)) || fallbackLook;
  const lbs = Number(r.lbs) || 0;
  const price = Number(r.price) || 0;
  return { name: r.name, note: look.note, img: look.img, price: price.toFixed(2), hasPrice: price > 0, lbs, available: lbs > 0 && price > 0 };
}));

// Items that were out of stock and just came back. The banner shows the first, with a count of the rest.
const restocked = ref([]);
let bannerTimer;
const dismissBanner = () => { clearTimeout(bannerTimer); restocked.value = []; };
function orderRestocked() {
  const p = restocked.value[0];
  dismissBanner();
  if (p) buying.value = p;
}
async function loadInventory() {
  try {
    const res = await fetch('/api/inventory');
    if (!res.ok) return;
    const rows = await res.json();
    const before = new Map(inventory.value.map((r) => [r.name.toLowerCase(), Number(r.lbs) || 0]));
    const wasLoaded = loaded.value;
    inventory.value = rows;
    if (wasLoaded) {
      // A fish with no row yet counts as out of stock, so a first-time add also triggers the overlay.
      const back = rows.filter((r) => (Number(r.lbs) || 0) > 0 && (before.get(r.name.toLowerCase()) || 0) <= 0).map((r) => r.name);
      if (back.length) {
        restocked.value = products.value.filter((p) => back.includes(p.name) && p.available);
        clearTimeout(bannerTimer);
        bannerTimer = setTimeout(dismissBanner, 20000);
      }
    }
  } catch { /* keep what is on screen */ } finally {
    loaded.value = true;
  }
}
// The server pushes a message the moment inventory changes. Polling every 30 seconds is the fallback.
let refresh;
let stream;
onMounted(() => {
  loadInventory();
  refresh = setInterval(loadInventory, 30000);
  if ('EventSource' in window) {
    stream = new EventSource('/api/inventory/stream');
    stream.addEventListener('inventory', loadInventory);
  }
});
onBeforeUnmount(() => {
  clearInterval(refresh);
  clearTimeout(bannerTimer);
  if (stream) stream.close();
});
</script>

<template>
  <div class="ex">
    <svg width="0" height="0" style="position:absolute" aria-hidden="true">
      <defs>
        <filter id="wc-edge" x="-10%" y="-10%" width="120%" height="120%">
          <feTurbulence type="fractalNoise" baseFrequency="0.018" numOctaves="1" seed="7" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="4" result="d" />
          <feGaussianBlur in="d" stdDeviation="0.5" />
        </filter>
        <filter id="wc-soft" x="-30%" y="-30%" width="160%" height="160%">
          <feTurbulence type="fractalNoise" baseFrequency="0.012" numOctaves="2" seed="3" result="n" />
          <feDisplacementMap in="SourceGraphic" in2="n" scale="60" result="d" />
          <feGaussianBlur in="d" stdDeviation="14" />
        </filter>
        <filter id="paper">
          <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="3" seed="2" />
          <feColorMatrix values="0 0 0 0 0.45  0 0 0 0 0.38  0 0 0 0 0.28  0 0 0 0.12 0" />
        </filter>
        <linearGradient id="can-red" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#e5836a" />
          <stop offset="0.55" stop-color="#d6684f" />
          <stop offset="1" stop-color="#c2503e" />
        </linearGradient>
        <linearGradient id="can-label" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fbf1d8" />
          <stop offset="1" stop-color="#f0dfb4" />
        </linearGradient>
      </defs>
    </svg>

    <div class="ex__wash" aria-hidden="true">
      <svg viewBox="0 0 1000 1600" preserveAspectRatio="none">
        <g filter="url(#wc-soft)" style="mix-blend-mode: multiply">
          <ellipse cx="120" cy="200" rx="380" ry="260" fill="#8cc4bc" opacity="0.6" />
          <ellipse cx="760" cy="150" rx="360" ry="220" fill="#f1c27d" opacity="0.6" />
          <ellipse cx="460" cy="470" rx="460" ry="200" fill="#ef9f8a" opacity="0.5" />
          <ellipse cx="900" cy="620" rx="300" ry="260" fill="#9db7d8" opacity="0.5" />
          <ellipse cx="150" cy="820" rx="360" ry="260" fill="#b7d2a5" opacity="0.45" />
          <ellipse cx="640" cy="1000" rx="440" ry="240" fill="#f1c27d" opacity="0.4" />
          <ellipse cx="200" cy="1300" rx="360" ry="260" fill="#9db7d8" opacity="0.45" />
          <ellipse cx="800" cy="1450" rx="360" ry="220" fill="#ef9f8a" opacity="0.4" />
        </g>
      </svg>
    </div>

    <header class="ex__bar">
      <a class="ex__powered" href="/" aria-label="Powered by Deckhand">
        <FishMark class="ex__bar-mark" />
        <span><small>Powered by</small><strong>DECKHAND</strong></span>
      </a>
      <form v-if="!subscribed" class="ex__notify" @submit.prevent="subscribe">
        <label for="ex-phone">Get a text when new fish lands</label>
        <div class="ex__notify-row">
          <input id="ex-phone" v-model="phone" type="tel" inputmode="tel" autocomplete="tel" placeholder="(555) 123-4567" />
          <button type="submit" :disabled="sending">Notify me</button>
        </div>
        <p v-if="phoneError" class="ex__notify-error" role="alert">{{ phoneError }}</p>
        <p v-else class="ex__notify-fine">Texts about new inventory only. Msg &amp; data rates may apply. Reply STOP to opt out.</p>
      </form>
      <p v-else class="ex__notify-ok" role="status">You're on the list. We'll text you when new fish lands.</p>

      <Teleport to="body">
      <Transition name="ex-restock">
        <div v-if="restocked.length" class="ex__restock-overlay" @click.self="dismissBanner">
        <div class="ex__restock" role="alertdialog" aria-label="New fish just landed">
          <svg class="ex__restock-scene" viewBox="0 0 300 90" aria-hidden="true">
            <circle class="ex__r-sun" cx="250" cy="22" r="10" />
            <path class="ex__r-wave" d="M0 66 Q20 58 40 66 T80 66 T120 66 T160 66 T200 66 T240 66 T280 66 T320 66 T360 66 T400 66 V90 H0 Z" />
            <g class="ex__r-boat"><path d="M110 56 H170 L160 70 H120 Z" /><path d="M138 56 V30 L158 56 Z" /></g>
            <g class="ex__r-fish"><path transform="translate(96 0) scale(-1 1)" d="M30 78 Q44 70 58 78 Q44 86 30 78 Z M58 78 L66 72 V84 Z" /></g>
          </svg>
          <p><strong>{{ restocked[0].name }}</strong> just landed<span v-if="restocked.length > 1"> (and {{ restocked.length - 1 }} more)</span>. Fresh always tastes best.</p>
          <button type="button" class="ex__restock-go" @click="orderRestocked">Order now</button>
          <button type="button" class="ex__restock-x" aria-label="Dismiss" @click="dismissBanner">&times;</button>
        </div>
        </div>
      </Transition>
      </Teleport>
    </header>

    <p class="ex__banner">Sample storefront. This is what Deckhand builds for you. <a href="/">Back to Deckhand</a></p>

    <header class="ex__hero">
      <svg class="ex__can" viewBox="0 0 220 240" role="img" aria-label="Off the Hook wild salmon can">
        <g>
          <ellipse cx="110" cy="214" rx="92" ry="15" fill="#b4533f" />
          <path d="M18 48 C16 100 17 160 18 212 C60 232 160 232 202 212 C203 160 204 100 202 48 Z" fill="url(#can-red)" />
          <ellipse cx="110" cy="48" rx="92" ry="15" fill="#f3e6c4" />
          <ellipse cx="110" cy="48" rx="78" ry="10" fill="#e3d2a2" />
          <rect x="32" y="88" width="156" height="104" fill="url(#can-label)" />
          <rect x="38" y="96" width="144" height="88" fill="none" stroke="#3f7a78" stroke-width="2.5" opacity="0.85" />
          <g transform="translate(110 137) scale(0.58) translate(-110 -148)">
            <path d="M58 140 C78 114 118 114 138 134 L162 120 L158 152 L162 176 L138 162 C116 182 78 180 58 156 Z" fill="#e0715a" />
            <path d="M72 138 C92 126 116 126 130 138" fill="none" stroke="#f6c7b6" stroke-width="3" stroke-linecap="round" opacity="0.8" />
            <circle cx="76" cy="146" r="3.2" fill="#2f5d5b" />
          </g>
        </g>
        <text x="110" y="122" text-anchor="middle" font-family="Pacifico, 'Segoe Script', 'Brush Script MT', cursive" font-size="13" fill="#2f5d5b">Wild Alaskan</text>
        <text x="110" y="174" text-anchor="middle" font-family="Pacifico, 'Segoe Script', 'Brush Script MT', cursive" font-size="15" fill="#b4533f">Off the Hook</text>
        <text x="110" y="206" text-anchor="middle" font-family="Lora, Georgia, serif" font-size="7.5" letter-spacing="1.8" fill="#fbf1d8">KODIAK  &#9733;  PACKED BY HAND</text>
      </svg>
      <h1>Off the Hook</h1>
      <p>These guys would look good on your table.</p>
      <a class="ex__cta" href="#catch" @click="tab = 'shop'">See this week's catch</a>
    </header>

    <nav class="ex__tabs" aria-label="Storefront">
      <button v-for="t in tabs" :key="t.key" type="button" :class="{ 'is-active': tab === t.key }" :aria-current="tab === t.key ? 'page' : undefined" @click="tab = t.key">{{ t.label }}</button>
    </nav>

    <section v-if="tab === 'story'" class="ex__story">
      <h2>Our story</h2>
      <div class="ex__story-body">
        <figure class="ex__portrait">
          <img v-if="storyPhoto" :src="storyPhoto" alt="Sara Swisher on the dock in Kodiak" />
          <svg v-else viewBox="0 0 200 240" role="img" aria-label="Illustrated portrait of Sara Swisher">
            <rect width="200" height="240" fill="#cfe3df" />
            <path d="M0 190 C40 176 80 202 120 188 C150 178 180 190 200 184 V240 H0 Z" fill="#8cc4bc" />
            <path d="M40 240 C40 186 70 168 100 168 C130 168 160 186 160 240 Z" fill="#d6684f" />
            <rect x="88" y="140" width="24" height="32" rx="10" fill="#e8b996" />
            <ellipse cx="100" cy="112" rx="38" ry="44" fill="#f0c7a5" />
            <path d="M60 108 C58 62 92 50 112 56 C140 60 148 86 140 118 C134 96 120 84 100 84 C80 84 66 94 60 108 Z" fill="#6b4a36" />
            <path d="M58 70 C62 40 96 30 120 38 C140 44 148 56 146 70 C130 52 96 48 58 70 Z" fill="#2f5d5b" />
            <circle cx="86" cy="112" r="3.2" fill="#2c3b40" />
            <circle cx="114" cy="112" r="3.2" fill="#2c3b40" />
            <path d="M88 130 C95 138 105 138 112 130" fill="none" stroke="#b4533f" stroke-width="3" stroke-linecap="round" />
          </svg>
          <figcaption>Sara Swisher, Kodiak</figcaption>
        </figure>
        <p>Hi, I'm Sara Swisher. I grew up fishing with my dad on Kodiak. Kodiak fish is the best there is, and it's the only fish I'll eat myself. Now I get to share it with the world.</p>
      </div>
    </section>

    <section v-if="tab === 'social'" class="ex__social">
      <h2>Follow along</h2>
      <p class="ex__social-note">Sample feed. On a real storefront, this shows your own posts as they go out.</p>
      <ul class="ex__feed">
        <li v-for="post in feed" :key="post.text">
          <img :src="post.img" :alt="post.alt" loading="lazy" />
          <p>{{ post.text }}</p>
          <span>{{ post.when }}</span>
        </li>
      </ul>
      <p class="ex__follow">
        <a href="#" @click.prevent>Instagram</a>
        <a href="#" @click.prevent>Facebook</a>
        <a href="#" @click.prevent>TikTok</a>
      </p>
    </section>

    <section v-if="tab === 'shop'" id="catch" class="ex__catch">
      <h2>This week's catch</h2>
      <p v-if="!loaded" class="ex__empty" role="status">Checking the dock...</p>
      <p v-else-if="!products.length" class="ex__empty">Nothing on the dock right now. Leave your number above and we'll text you when new fish lands.</p>
      <ul v-else>
        <li v-for="p in products" :key="p.name" :class="{ 'is-out': !p.available }">
          <img :src="p.img" :alt="p.name" loading="lazy" />
          <div>
            <h3>{{ p.name }}</h3>
            <p>{{ p.note }}</p>
            <strong v-if="p.hasPrice">${{ p.price }}<span> / lb</span></strong>
            <span class="ex__stock">{{ p.available ? `${p.lbs} lb available` : 'Not available' }}</span>
          </div>
          <button type="button" :disabled="!p.available" @click="buying = p">{{ p.available ? 'Buy' : 'Not available' }}</button>
        </li>
      </ul>
    </section>

    <CheckoutModal v-if="buying" :product="buying" @close="buying = null" @paid="onPaid" />

    <footer class="ex__foot">
      <p>Off the Hook</p>
    </footer>

    <svg class="ex__paper" aria-hidden="true"><rect width="100%" height="100%" filter="url(#paper)" /></svg>
  </div>
</template>

<style scoped>
.ex { position: relative; min-height: 100vh; overflow-x: clip; background: #f8eed6; color: #2c3b40; font-family: Lora, Georgia, serif; }
.ex__wash { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.ex__wash svg { width: 100%; height: 100%; }
.ex__paper { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; mix-blend-mode: multiply; }
.ex__bar { position: sticky; top: 0; z-index: 10; display: flex; align-items: center; justify-content: space-between; gap: 1rem 1.5rem; flex-wrap: wrap; padding: 0.6rem 1.25rem; background: #0f204b; color: #fff; font-family: system-ui, sans-serif; box-shadow: 0 2px 10px rgba(15, 32, 75, 0.35); }
.ex__powered { display: inline-flex; align-items: center; gap: 0.7rem; color: inherit; text-decoration: none; }
.ex__bar-mark { width: 2.6rem; height: auto; }
.ex__powered span { display: grid; line-height: 1.1; }
.ex__powered small { color: #a9b6d6; font-size: 0.75rem; letter-spacing: 0.08em; text-transform: uppercase; }
.ex__powered strong { color: #ffb612; font-size: 1.25rem; letter-spacing: 0.12em; }
.ex__notify { display: grid; gap: 0.25rem; min-width: min(100%, 22rem); }
.ex__notify label { font-size: 0.85rem; font-weight: 700; }
.ex__notify-row { display: flex; gap: 0.5rem; }
.ex__notify-row input { flex: 1; min-width: 0; height: 2.5rem; padding: 0 0.8rem; font: inherit; border: 1px solid #a9b6d6; border-radius: 8px; background: #fff; color: #0f204b; }
.ex__notify-row button { flex: none; height: 2.5rem; padding: 0 1.1rem; font: inherit; font-weight: 700; border: 0; border-radius: 8px; background: #ffb612; color: #0f204b; cursor: pointer; }
.ex__notify-row button:disabled { opacity: 0.6; cursor: default; }
.ex__notify-row input:focus-visible, .ex__notify-row button:focus-visible { outline: 3px solid #5b8cff; outline-offset: 2px; }
.ex__notify-fine, .ex__notify-error, .ex__notify-ok { margin: 0; font-size: 0.75rem; }
.ex__notify-fine { color: #a9b6d6; }
.ex__notify-error { color: #ffb4ab; }
.ex__notify-ok { font-size: 0.95rem; font-weight: 700; color: #ffb612; }
.ex__banner { position: relative; z-index: 2; margin: 0; padding: 0.6rem 1rem; text-align: center; background: rgba(77, 133, 130, 0.92); color: #f7edd3; font-size: 0.95rem; }
.ex__banner a { color: #f6d99a; margin-left: 0.5rem; }
.ex__hero { position: relative; z-index: 1; display: grid; justify-items: center; gap: 1rem; text-align: center; padding: 3.5rem 1.5rem 4rem; }
.ex__can { width: 11rem; height: auto; padding: 0.5rem 0.75rem; filter: drop-shadow(0 12px 14px rgba(80, 60, 40, 0.28)); }
.ex__hero h1, .ex__story h2, .ex__catch h2 { font-family: Pacifico, 'Segoe Script', 'Brush Script MT', cursive; font-weight: 400; }
.ex__hero h1 { margin: 0; font-size: clamp(2.6rem, 7vw, 4.2rem); line-height: 1.15; color: #2f5d5b; text-shadow: 0 2px 0 rgba(251, 241, 216, 0.8); }
.ex__hero p { margin: 0; max-width: 34rem; font-size: 1.3rem; color: #34484a; }
.ex__cta { padding: 0.8rem 2rem; border-radius: 60% 40% 55% 45% / 50% 55% 45% 50%; background: #d6684f; color: #fbf1d8; text-decoration: none; font-weight: 600; box-shadow: inset 0 0 12px rgba(120, 40, 20, 0.25); }
.ex__story, .ex__catch { position: relative; z-index: 1; max-width: 56rem; margin: 0 auto; padding: 3rem 1.5rem 0; }
.ex__story h2, .ex__catch h2 { margin: 0 0 0.75rem; font-size: 2rem; color: #b4533f; }
.ex__story p { margin: 0; font-size: 1.2rem; line-height: 1.65; }
.ex__story-body { display: grid; grid-template-columns: 12rem minmax(0, 1fr); gap: 1.75rem; align-items: center; }
.ex__portrait { margin: 0; text-align: center; }
.ex__portrait img, .ex__portrait svg { display: block; width: 100%; aspect-ratio: 5 / 6; object-fit: cover; border-radius: 18px 26px 20px 28px / 24px 18px 28px 20px; box-shadow: 0 0 0 1.5px rgba(77, 133, 130, 0.3), 0 10px 26px rgba(127, 183, 176, 0.25); }
.ex__portrait figcaption { margin-top: 0.5rem; color: #5d6c6e; font-size: 0.95rem; }
@media (max-width: 40rem) { .ex__story-body { grid-template-columns: minmax(0, 1fr); justify-items: center; } .ex__portrait { width: min(100%, 12rem); } }
.ex__catch ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.1rem; }
.ex__catch li { display: grid; grid-template-columns: 7rem 1fr auto; align-items: center; gap: 1.25rem; padding: 1rem; background: rgba(255, 252, 240, 0.62); backdrop-filter: blur(2px); border-radius: 18px 26px 20px 28px / 24px 18px 28px 20px; box-shadow: 0 0 0 1.5px rgba(77, 133, 130, 0.3), 0 10px 26px rgba(127, 183, 176, 0.25); }
.ex__catch img { width: 7rem; height: 5.5rem; object-fit: cover; border-radius: 12px 18px 12px 20px; opacity: 0.92; filter: saturate(0.85) contrast(0.95); }
.ex__catch h3 { margin: 0 0 0.2rem; color: #2f5d5b; font-weight: 600; }
.ex__catch p { margin: 0 0 0.3rem; color: #5d6c6e; }
.ex__catch strong { color: #b4533f; }
.ex__catch strong span { font-weight: 400; color: #5d6c6e; }
.ex__catch .ex__stock { display: block; margin-top: 0.15rem; font-weight: 400; font-size: 0.85rem; color: #5d6c6e; }
.ex__catch li.is-out { opacity: 0.55; filter: grayscale(1); }
.ex__catch li.is-out h3, .ex__catch li.is-out strong { color: #6b7578; }
.ex__catch li.is-out .ex__stock { font-weight: 700; }
.ex__catch button:disabled { opacity: 0.7; cursor: not-allowed; }
.ex__restock-overlay { position: fixed; inset: 0; z-index: 100; display: flex; align-items: center; justify-content: center; padding: 1rem; background: rgba(15, 32, 75, 0.55); }
.ex__restock { position: relative; width: min(38rem, 100%); display: flex; flex-direction: column; align-items: center; text-align: center; gap: 1rem; padding: 1.5rem; background: #fbf1d8; color: #2c3b40; border-top: 5px solid #ffb612; border-radius: 16px; font-family: Lora, Georgia, serif; box-shadow: 0 20px 50px rgba(0, 0, 0, 0.35); }
.ex__restock p { margin: 0; min-width: 0; font-size: 2rem; line-height: 1.25; }
.ex__restock p strong { color: #b4533f; }
.ex__restock-scene { flex: none; width: 14rem; max-width: 100%; height: auto; border-radius: 10px; background: #cfe3df; }
.ex__restock-go { flex: none; padding: 1.1rem 3.5rem; font-size: 1.6rem; font: inherit; font-weight: 700; border: 0; border-radius: 999px; background: #d6684f; color: #fbf1d8; cursor: pointer; }
.ex__restock-go:focus-visible, .ex__restock-x:focus-visible { outline: 3px solid #5b8cff; outline-offset: 2px; }
.ex__restock-x { position: absolute; top: 0.5rem; right: 0.75rem; border: 0; background: none; font-size: 1.5rem; line-height: 1; cursor: pointer; color: #2c3b40; }
.ex__r-sun { fill: #f3c871; }
.ex__r-wave { fill: #3f7a78; opacity: 0.8; animation: ex-wave 4s linear infinite; }
.ex__r-boat { fill: #b4533f; transform-box: fill-box; animation: ex-bob 3s ease-in-out infinite; }
.ex__r-fish { fill: #f2a58f; animation: ex-swim 3s ease-in-out infinite; }
@keyframes ex-wave { to { transform: translateX(-80px); } }
@keyframes ex-bob { 50% { transform: translateY(-3px) rotate(2deg); } }
@keyframes ex-swim { 0%, 100% { transform: translateX(0); } 50% { transform: translateX(120px); } }
.ex-restock-enter-active { transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.4s ease; }
.ex-restock-leave-active { transition: transform 0.3s ease, opacity 0.3s ease; }
.ex-restock-enter-from, .ex-restock-leave-to { opacity: 0; }
.ex-restock-enter-from .ex__restock { transform: scale(0.85) translateY(1.5rem); }
.ex-restock-enter-active .ex__restock { transition: transform 0.5s cubic-bezier(0.2, 0.9, 0.3, 1.2); }
@media (max-width: 40rem) { .ex__restock p { font-size: 1.5rem; } .ex__restock-go { padding: 0.9rem 2.5rem; font-size: 1.3rem; } }
@media (prefers-reduced-motion: reduce) { .ex__r-wave, .ex__r-boat, .ex__r-fish { animation: none; } .ex-restock-enter-active, .ex-restock-leave-active { transition: opacity 0.2s ease; } .ex-restock-enter-from, .ex-restock-leave-to { transform: none; } }
.ex__empty { margin: 0; padding: 1.5rem; border-radius: 18px; background: rgba(255, 252, 240, 0.62); color: #5d6c6e; font-size: 1.1rem; }
.ex__catch button { font: inherit; padding: 0.6rem 1.3rem; border: 0; border-radius: 999px; background: rgba(138, 166, 201, 0.35); color: #55667c; }
.ex__foot { position: relative; z-index: 1; padding: 3rem 1.5rem; text-align: center; color: #5d6c6e; }
.ex__brand { display: inline-flex; align-items: center; gap: 0.7rem; vertical-align: middle; margin-left: 0.5rem; padding: 0.65rem 1.5rem 0.65rem 1rem; border-radius: 999px; background: rgba(63, 122, 120, 0.5); color: #fff; text-decoration: none; font-weight: 600; font-family: system-ui, sans-serif; letter-spacing: 0.06em; font-size: 0.85rem; }
.ex__foot-mark { width: 2.4rem; height: auto; }
.ex__tabs { position: relative; z-index: 1; display: flex; justify-content: center; gap: 0.5rem; padding: 0 1rem; }
.ex__tabs button { font: inherit; font-weight: 600; padding: 0.55rem 1.4rem; border: 0; border-radius: 999px; background: rgba(255, 252, 240, 0.55); color: #2f5d5b; cursor: pointer; }
.ex__tabs button.is-active { background: #2f5d5b; color: #fbf1d8; }
.ex__social { position: relative; z-index: 1; max-width: 56rem; margin: 0 auto; padding: 3rem 1.5rem 0; }
.ex__social h2 { margin: 0 0 0.5rem; font-family: Pacifico, 'Segoe Script', 'Brush Script MT', cursive; font-weight: 400; font-size: 2rem; color: #b4533f; }
.ex__social-note { margin: 0 0 1.25rem; color: #5d6c6e; }
.ex__feed { list-style: none; margin: 0; padding: 0; display: grid; grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr)); gap: 1rem; }
.ex__feed li { background: rgba(255, 252, 240, 0.7); border-radius: 18px 26px 20px 28px / 24px 18px 28px 20px; overflow: hidden; box-shadow: 0 0 0 1.5px rgba(77, 133, 130, 0.3), 0 10px 26px rgba(127, 183, 176, 0.25); }
.ex__feed img { display: block; width: 100%; height: 11rem; object-fit: cover; filter: saturate(0.85); }
.ex__feed p { margin: 0; padding: 0.8rem 1rem 0.2rem; }
.ex__feed span { display: block; padding: 0 1rem 0.9rem; color: #647274; font-size: 0.85rem; }
.ex__follow { display: flex; gap: 0.6rem; margin: 1.5rem 0 0; }
.ex__follow a { padding: 0.5rem 1.2rem; border-radius: 999px; background: rgba(138, 166, 201, 0.35); color: #2f5d5b; text-decoration: none; font-weight: 600; }
@media (max-width: 40rem) { .ex__catch li { grid-template-columns: 5rem 1fr; } .ex__catch img { width: 5rem; } .ex__catch button { grid-column: 1 / -1; } }
</style>
