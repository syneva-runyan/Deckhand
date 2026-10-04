<script setup>
// Shows a fisherman what the same catch brings in at the dock and sold direct,
// using the two prices typed into the form.
import { computed } from 'vue';

import { money } from '../api.js';

const props = defineProps({
  worth: { type: Object, required: true },
});

const widest = computed(() => Math.max(props.worth.dockTotal, props.worth.directTotal, 1));
const width = (total) => `${Math.max(2, (total / widest.value) * 100)}%`;
</script>

<template>
  <section class="card worth">
    <h2 class="card__title">What this catch is worth</h2>

    <div class="worth__row">
      <span class="worth__label">At the dock</span>
      <span class="worth__bar"><span class="worth__fill worth__fill--dock" :style="{ width: width(worth.dockTotal) }"></span></span>
      <span class="worth__total">{{ money(worth.dockTotal) }}</span>
    </div>
    <div class="worth__row">
      <span class="worth__label">Sold direct</span>
      <span class="worth__bar"><span class="worth__fill worth__fill--direct" :style="{ width: width(worth.directTotal) }"></span></span>
      <span class="worth__total">{{ money(worth.directTotal) }}</span>
    </div>

    <p v-if="worth.extra > 0" class="worth__extra">
      <strong>{{ money(worth.extra) }} more</strong>
      <span v-if="worth.multiple"> · {{ worth.multiple }}× the dock price</span>
    </p>
    <p class="worth__message">{{ worth.message }}</p>
    <p class="note">Worked out from the two prices you entered.</p>
  </section>
</template>
