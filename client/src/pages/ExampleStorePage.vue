<script setup>
import { ref } from 'vue';
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

// Sample posts, standing in for a live social feed.
const feed = [
  { img: '/media/salmon.webp', alt: 'Fresh salmon', text: 'Fresh off the Rock. Pulled this morning, frozen by noon.', when: 'Mon' },
  { img: '/media/boat.webp', alt: 'Boat on the water', text: 'Another early start out of Kodiak.', when: 'Wed' },
  { img: '/media/fish.webp', alt: 'Salmon on the line', text: 'Caught on the Rock, shipped to your door.', when: 'Fri' },
];

// A fixed sample storefront, showing what Deckhand builds for a fisherman. Nothing here is live.
const products = [
  { name: 'King salmon fillets', note: 'Skin-on, vacuum sealed, flash frozen', price: '24.00', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Halibut_and_salmon_fillets.jpg?width=600' },
  { name: 'Sockeye portions', note: 'Six 6 oz portions per box', price: '18.00', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Sockeye_salmon_fillets.png?width=600' },
  { name: 'Halibut, whole fillet', note: 'Cut to order, 5 lb minimum', price: '22.00', img: 'https://commons.wikimedia.org/wiki/Special:FilePath/Halibut_fillets_with_tomatoes,_peppers_and_mint_(26713896144).jpg?width=600' },
];
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

    <p class="ex__banner">Sample storefront. This is what Deckhand builds for you. <a href="/">Back to Deckhand</a></p>

    <header class="ex__hero">
      <svg class="ex__can" viewBox="0 0 220 240" role="img" aria-label="Off the Rock wild salmon can">
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
        <text x="110" y="174" text-anchor="middle" font-family="Pacifico, 'Segoe Script', 'Brush Script MT', cursive" font-size="15" fill="#b4533f">Off the Rock</text>
        <text x="110" y="206" text-anchor="middle" font-family="Lora, Georgia, serif" font-size="7.5" letter-spacing="1.8" fill="#fbf1d8">KODIAK  &#9733;  PACKED BY HAND</text>
      </svg>
      <h1>Off the Rock</h1>
      <p>These guys would look good on your table.</p>
      <a class="ex__cta" href="#catch" @click="tab = 'shop'">See this week's catch</a>
    </header>

    <nav class="ex__tabs" aria-label="Storefront">
      <button v-for="t in tabs" :key="t.key" type="button" :class="{ 'is-active': tab === t.key }" :aria-current="tab === t.key ? 'page' : undefined" @click="tab = t.key">{{ t.label }}</button>
    </nav>

    <section v-if="tab === 'story'" class="ex__story">
      <h2>Our story</h2>
      <p>Hi, I'm Sara Swisher. I grew up fishing with my dad on Kodiak. Kodiak fish is the best there is, and it's the only fish I'll eat myself. Now I get to share it with the world.</p>
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
      <ul>
        <li v-for="p in products" :key="p.name">
          <img :src="p.img" :alt="p.name" loading="lazy" />
          <div>
            <h3>{{ p.name }}</h3>
            <p>{{ p.note }}</p>
            <strong>${{ p.price }}<span> / lb</span></strong>
          </div>
          <button type="button" @click="buying = p">Buy</button>
        </li>
      </ul>
    </section>

    <CheckoutModal v-if="buying" :product="buying" @close="buying = null" @paid="onPaid" />

    <footer class="ex__foot">
      <p>Off the Rock. Built with <br/><a class="ex__brand" href="/"><FishMark class="ex__foot-mark" /><span>Deckhand</span></a></p>
    </footer>

    <svg class="ex__paper" aria-hidden="true"><rect width="100%" height="100%" filter="url(#paper)" /></svg>
  </div>
</template>

<style scoped>
.ex { position: relative; min-height: 100vh; overflow-x: hidden; background: #f8eed6; color: #2c3b40; font-family: Lora, Georgia, serif; }
.ex__wash { position: absolute; inset: 0; z-index: 0; pointer-events: none; }
.ex__wash svg { width: 100%; height: 100%; }
.ex__paper { position: fixed; inset: 0; width: 100%; height: 100%; pointer-events: none; z-index: 5; mix-blend-mode: multiply; }
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
.ex__catch ul { list-style: none; margin: 0; padding: 0; display: grid; gap: 1.1rem; }
.ex__catch li { display: grid; grid-template-columns: 7rem 1fr auto; align-items: center; gap: 1.25rem; padding: 1rem; background: rgba(255, 252, 240, 0.62); backdrop-filter: blur(2px); border-radius: 18px 26px 20px 28px / 24px 18px 28px 20px; box-shadow: 0 0 0 1.5px rgba(77, 133, 130, 0.3), 0 10px 26px rgba(127, 183, 176, 0.25); }
.ex__catch img { width: 7rem; height: 5.5rem; object-fit: cover; border-radius: 12px 18px 12px 20px; opacity: 0.92; filter: saturate(0.85) contrast(0.95); }
.ex__catch h3 { margin: 0 0 0.2rem; color: #2f5d5b; font-weight: 600; }
.ex__catch p { margin: 0 0 0.3rem; color: #5d6c6e; }
.ex__catch strong { color: #b4533f; }
.ex__catch strong span { font-weight: 400; color: #5d6c6e; }
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
