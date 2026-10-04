<script setup>
// The headline block of a collective's site: status, species, the key facts
// and the home port's local line.
import FishMark from './FishMark.vue';

defineProps({
  sign: { type: Object, required: true },
});
</script>

<template>
  <section class="sign" :class="{ 'sign--soldout': sign.headline === 'SOLD OUT' }">
    <FishMark class="sign__mark" />
    <p class="sign__headline">{{ sign.headline }}</p>
    <h2 class="sign__species">{{ sign.species }}</h2>
    <ul class="sign__lines">
      <li v-for="line in sign.lines" :key="line">{{ line }}</li>
    </ul>
    <p class="sign__slogan">
      <template v-for="part in sign.slogan" :key="part.text"><span :class="{ accent: part.accent }">{{ part.text }}</span>{{ ' ' }}</template>
    </p>
    <p class="sign__from">{{ sign.boat }} · {{ sign.collective }} · {{ sign.port }}</p>
  </section>
</template>
