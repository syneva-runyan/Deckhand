<script setup>
import { ref } from 'vue';

import FishMark from '../components/FishMark.vue';

const asleep = ref(false);
const leaving = ref(false);

// Fade the landing page out, then go to the dashboard.
function enterApp(event) {
  if (event.metaKey || event.ctrlKey || event.shiftKey) return;
  event.preventDefault();
  leaving.value = true;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  sessionStorage.setItem('deckhand-enter', '1');
  setTimeout(() => { window.location.href = '/app/orders'; }, reduce ? 0 : 300);
}

const offerings = [
  ['Your website', 'We build it and take the orders.'],
  ['Your marketing', 'Free and premium packages. Real people on both, helping you show up as the real you.'],
  ['Your shipping', 'We tell you about orders and send labels to print.'],
];
</script>

<template>
  <div class="page landing" :class="{ 'is-leaving': leaving }">

    <main class="landing__hero">
      <FishMark class="landing__mark" lively :asleep="asleep" ground="#f2b93b" accent="#0f204b" />
      <h1 class="landing__name">DECKHAND</h1>
      <p class="landing__tag">MORE DECK. LESS DESK.</p>
      <p class="landing__story" @mouseenter="asleep = true" @mouseleave="asleep = false">After 24 hours on the water, the last thing you need to do is marketing and customer service.</p>
      <a class="landing__cta" href="#how">Learn more</a>
    </main>

    <section id="how" class="landing__band">
      <div class="landing__pillars">
        <h2 class="landing__eyebrow">You fish. We do the rest.</h2>
        <ul>
          <li v-for="[title, text] in offerings" :key="title">
            <strong>{{ title }}</strong>
            <span>{{ text }}</span>
          </li>
        </ul>
      </div>

      <div class="landing__media">
        <div class="m-tile m-boat"><img src="/media/boat.webp" alt="Fishing boat at the dock in Kodiak, Alaska" loading="lazy" /></div>
        <div class="m-tile m-video">
          <video autoplay muted loop playsinline preload="metadata" poster="/media/catch-poster.jpg" aria-label="Fish being handled on deck">
            <source src="/media/catch.mp4" type="video/mp4" />
          </video>
        </div>
        <div class="m-tile m-salmon"><img src="/media/salmon.webp" alt="Cooked salmon with lemon and dill" loading="lazy" /></div>
        <div class="m-tile m-fish"><img src="/media/fish.webp" alt="Wild salmon resting in a clear river" loading="lazy" /></div>
      </div>

      <div class="landing__trial">
        <a class="landing__cta" href="/app/orders" @click="enterApp">Try for Free</a>
        <p class="landing__tertiary">Not ready yet? <a href="/example">Tour a sample storefront</a></p>
      </div>
    </section>

    <footer class="landing__foot">
      <p class="landing__headline">More deck. Less desk.</p>
      <p>Built for independent fishermen selling direct.</p>
      <p class="landing__legal"><a href="/terms">Terms</a> <a href="/privacy">Privacy</a></p>
    </footer>
  </div>
</template>



