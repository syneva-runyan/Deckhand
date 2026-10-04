<script setup>
// The Deckhand mark: a tagged fish under the Big Dipper and the North Star.
// `ground` is the colour behind the mark, used for the eye and the tag hole.
defineProps({
  ground: { type: String, default: '#0f204b' },
  accent: { type: String, default: '#ffb612' },
  // Awake by default; snoozes while sleep is true.
  body: { type: String, default: '#ffffff' },
  lively: { type: Boolean, default: false },
  asleep: { type: Boolean, default: false },
});
</script>

<template>
  <svg viewBox="12 -8 196 216" role="img" aria-label="Deckhand" :class="{ fish: lively, 'fish--asleep': asleep }">
    <g class="fish__stars" :fill="accent">
      <circle cx="40" cy="14" r="3.6" />
      <circle cx="58" cy="10" r="3.6" />
      <circle cx="74" cy="16" r="3.6" />
      <circle cx="90" cy="22" r="3.6" />
      <circle cx="94" cy="40" r="3.6" />
      <circle cx="116" cy="42" r="3.6" />
      <circle cx="118" cy="24" r="3.6" />
      <path d="M176 -2 L179 7 L188 10 L179 13 L176 22 L173 13 L164 10 L173 7 Z" />
    </g>
    <text v-if="lively" class="fish__zzz" x="178" y="92" :fill="accent">z z z</text>
    <g transform="translate(0 34)"><g class="fish__body">
      <path d="M52 78 Q118 6 196 78 Q118 150 52 78 Z" :fill="body" />
      <path class="fish__tail" d="M64 78 L22 46 L36 78 L22 110 Z" :fill="body" />
      <circle class="fish__eye" cx="166" cy="70" r="4.5" :fill="ground" />
      <path d="M24 106 L28 105 L55 153 L51 155 Z" :fill="accent" />
      <g transform="translate(70 148) rotate(-20)">
        <path d="M-28 -6 L-18 -17 L28 -17 L28 17 L-18 17 L-28 6 Z" :fill="accent" />
        <circle cx="-16" cy="0" r="3.5" :fill="ground" />
      </g>
    </g></g>
  </svg>
</template>


<style scoped>
.fish { overflow: visible; }
.fish__body, .fish__eye { transform-box: fill-box; transform-origin: 50% 50%; }
.fish__body { transition: transform 0.8s ease; }
.fish__eye { transition: transform 0.4s ease; }
.fish__zzz { font-family: var(--stencil); font-size: 13px; opacity: 0; }
.fish--asleep .fish__body { animation: fish-doze 3s ease-in-out infinite; }
.fish--asleep .fish__eye { transform: scaleY(0.12); }
.fish--asleep .fish__zzz { animation: fish-zzz 2.5s ease-in-out infinite; }
@keyframes fish-doze {
  0%, 100% { transform: rotate(5deg) translateY(2px); }
  50% { transform: rotate(7deg) translateY(5px); }
}
@keyframes fish-zzz {
  0% { opacity: 0; transform: translateY(0); }
  30% { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(-14px); }
}
@media (prefers-reduced-motion: reduce) {
  .fish--asleep .fish__body, .fish--asleep .fish__zzz { animation: none; }
}
</style>