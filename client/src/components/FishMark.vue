<script setup>
// The Deckhand mark: a tagged fish under the Big Dipper and the North Star.
// `ground` is the colour behind the mark, used for the eye and the tag hole.
defineProps({
  ground: { type: String, default: '#0f204b' },
  accent: { type: String, default: '#ffb612' },
});
</script>

<template>
  <svg viewBox="12 -8 196 216" role="img" aria-label="Deckhand">
    <g :fill="accent">
      <circle cx="40" cy="14" r="3.6" />
      <circle cx="58" cy="10" r="3.6" />
      <circle cx="74" cy="16" r="3.6" />
      <circle cx="90" cy="22" r="3.6" />
      <circle cx="94" cy="40" r="3.6" />
      <circle cx="116" cy="42" r="3.6" />
      <circle cx="118" cy="24" r="3.6" />
      <path d="M176 -2 L179 7 L188 10 L179 13 L176 22 L173 13 L164 10 L173 7 Z" />
    </g>
    <g transform="translate(0 34)">
      <path d="M52 78 Q118 6 196 78 Q118 150 52 78 Z" fill="#ffffff" />
      <path d="M64 78 L22 46 L36 78 L22 110 Z" fill="#ffffff" />
      <circle cx="166" cy="70" r="4.5" :fill="ground" />
      <path d="M24 106 L28 105 L55 153 L51 155 Z" :fill="accent" />
      <g transform="translate(70 148) rotate(-20)">
        <path d="M-28 -6 L-18 -17 L28 -17 L28 17 L-18 17 L-28 6 Z" :fill="accent" />
        <circle cx="-16" cy="0" r="3.5" :fill="ground" />
      </g>
    </g>
  </svg>
</template>

