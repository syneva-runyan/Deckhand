<script setup>
// The animated journey a buyer watches: water, boat, processing shed, packing
// table, plane. The fish (later a box) slides to the stop for the current
// stage. All of the motion is CSS, in style.css.
import { computed } from 'vue';

const props = defineProps({
  stageIndex: { type: Number, required: true },
});

const STOPS = [80, 240, 400, 560, 720];
const TOKEN = [
  { x: 80, y: 230 },
  { x: 240, y: 160 },
  { x: 400, y: 184 },
  { x: 560, y: 177 },
  { x: 720, y: 163 },
];

const token = computed(() => TOKEN[props.stageIndex] ?? TOKEN[0]);
const progress = computed(() => STOPS[props.stageIndex] - STOPS[0]);
</script>

<template>
  <svg class="journey" viewBox="0 56 800 234" role="img" :aria-label="`Stage ${stageIndex + 1} of 5`">
    <defs>
      <clipPath id="journey-water"><rect x="0" y="196" width="322" height="60" /></clipPath>
    </defs>

    <!-- sky -->
    <g fill="#ffb612" transform="translate(430 62) scale(0.75)">
      <circle cx="40" cy="14" r="3.6" />
      <circle cx="58" cy="10" r="3.6" />
      <circle cx="74" cy="16" r="3.6" />
      <circle cx="90" cy="22" r="3.6" />
      <circle cx="94" cy="40" r="3.6" />
      <circle cx="116" cy="42" r="3.6" />
      <circle cx="118" cy="24" r="3.6" />
      <path d="M176 -2 L179 7 L188 10 L179 13 L176 22 L173 13 L164 10 L173 7 Z" />
    </g>

    <!-- shore -->
    <rect x="322" y="204" width="478" height="4" rx="2" fill="#ffffff" opacity="0.3" />

    <!-- boat -->
    <g class="journey__boat">
      <rect x="252" y="146" width="3" height="50" fill="#ffffff" />
      <path d="M255 148 L274 155 L255 162 Z" fill="#ffb612" />
      <rect x="222" y="176" width="28" height="20" fill="#ffffff" />
      <rect x="228" y="181" width="8" height="7" fill="#0f204b" />
      <path d="M192 196 L288 196 L274 216 L206 216 Z" fill="#ffffff" />
    </g>

    <!-- water, drawn over the hull -->
    <g clip-path="url(#journey-water)">
      <g class="journey__waves" fill="none" stroke="#8fb4ff" stroke-width="3" stroke-linecap="round">
        <path d="M-40 210 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" />
        <path d="M-20 226 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" opacity="0.7" />
        <path d="M-40 242 q10 -8 20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0 t20 0" opacity="0.45" />
      </g>
    </g>

    <!-- processing shed -->
    <g>
      <path d="M356 164 L400 134 L444 164 Z" fill="#ffffff" />
      <rect x="364" y="164" width="72" height="40" fill="#1b3270" stroke="#ffffff" stroke-width="3" />
    </g>

    <!-- packing table -->
    <g fill="#ffffff">
      <rect x="524" y="196" width="72" height="5" rx="2" />
      <rect x="532" y="201" width="4" height="5" />
      <rect x="584" y="201" width="4" height="5" />
    </g>

    <!-- plane -->
    <g class="journey__plane" :class="{ 'is-flying': stageIndex === 4 }" fill="#ffffff">
      <path d="M676 128 Q722 112 768 128 Q722 142 676 128 Z" />
      <path d="M712 128 L732 128 L716 152 L704 152 Z" />
      <path d="M680 128 L672 110 L684 110 L696 126 Z" />
    </g>

    <!-- progress track -->
    <rect x="80" y="266" width="640" height="4" rx="2" fill="#ffffff" opacity="0.2" />
    <rect class="journey__progress" x="80" y="266" height="4" rx="2" fill="#ffb612" :style="{ width: `${progress}px` }" />
    <circle
      v-for="(x, i) in STOPS"
      :key="x"
      :cx="x"
      cy="268"
      r="8"
      :fill="i <= stageIndex ? '#ffb612' : '#0f204b'"
      :stroke="i <= stageIndex ? '#ffb612' : '#ffffff'"
      stroke-width="2"
    />

    <!-- the fish, then the box -->
    <g class="journey__token" :style="{ transform: `translate(${token.x}px, ${token.y}px)` }">
      <g class="journey__token-inner" :class="stageIndex === 0 ? 'is-swimming' : 'is-bobbing'">
        <g v-if="stageIndex < 3" transform="scale(0.42) translate(-109 -78)">
          <path d="M52 78 Q118 28 196 78 Q118 128 52 78 Z" fill="#ffffff" />
          <path d="M64 78 L22 46 L36 78 L22 110 Z" fill="#ffffff" />
          <circle cx="166" cy="70" r="5" fill="#0f204b" />
          <g v-if="stageIndex === 1" fill="#ffb612">
            <path d="M24 106 L28 105 L55 153 L51 155 Z" />
            <g transform="translate(70 148) rotate(-20)">
              <path d="M-28 -6 L-18 -17 L28 -17 L28 17 L-18 17 L-28 6 Z" />
            </g>
          </g>
        </g>
        <g v-else>
          <rect x="-24" y="-18" width="48" height="36" rx="3" fill="#ffffff" />
          <rect x="-4" y="-18" width="8" height="36" fill="#ffb612" />
          <rect x="-24" y="-3" width="48" height="6" fill="#ffb612" />
        </g>
      </g>
    </g>
  </svg>
</template>
