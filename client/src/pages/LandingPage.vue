<script setup>
import FishMark from '../components/FishMark.vue';

const steps = [
  ['Tell us about the catch', 'Species, grounds, boat and when you land.'],
  ['Get your own page', 'Deckhand writes it and takes orders straight from buyers.'],
  ['Show buyers their fish', 'Every order is tracked from the water to their door.'],
];
</script>

<template>
  <div class="page landing">

    <main class="landing__hero">
      <FishMark class="landing__mark" ground="#f2b93b" accent="#0f204b" />
      <h1 class="landing__name">DECKHAND</h1>
      <p class="landing__tag">MORE DECK. LESS DESK.</p>
      <a class="landing__cta" href="#how">See how it works</a>
    </main>

    <section id="how" class="landing__band">
      <div class="landing__steps">
        <h2 class="landing__eyebrow">How it works</h2>
        <ol>
          <li v-for="([title, text], i) in steps" :key="title">
            <span class="landing__num">{{ i + 1 }}</span>
            <strong>{{ title }}</strong>
            <span>{{ text }}</span>
          </li>
        </ol>
      </div>
    </section>

    <footer class="landing__foot">
      <p class="landing__headline">More deck. Less desk.</p>
      <p>Built for fishermen's collectives selling direct.</p>
    </footer>
  </div>
</template>



