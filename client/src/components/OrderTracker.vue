<script setup>
import { computed, ref } from 'vue';
import { boat, sampleStatus } from '../lib/boat.js';

const props = defineProps({ order: { type: Object, required: true }, inline: Boolean });
defineEmits(['close']);

// Hovering a step previews that step in the scene.
const hover = ref('');
const scene = computed(() => hover.value || 'water');

// Live when the fisherman has connected a boat, otherwise a labelled sample.
const live = computed(() => boat.connected);
const status = computed(() => sampleStatus());
const out = computed(() => status.value.out);
const eta = computed(() => (out.value ? '2 days' : '6 hours'));

const steps = computed(() => [
  { key: 'placed', label: 'Order placed', done: true },
  { key: 'water', label: out.value ? 'Out fishing' : 'At the dock', done: true, now: true, scene: 'water' },
  { key: 'clean', label: 'Cleaned and frozen', done: false, scene: 'clean' },
  { key: 'pack', label: 'Packaged', done: false, scene: 'pack' },
  { key: 'ship', label: 'On its way', done: false, scene: 'ship' },
]);
</script>

<template>
  <div class="trk" :class="{ 'trk--inline': inline }" role="dialog" aria-modal="true" aria-label="Order tracker">
    <div class="trk__card">
      <button v-if="!inline" type="button" class="trk__x" aria-label="Close" @click="$emit('close')">&times;</button>
      <p class="trk__id">Order {{ props.order.id }}</p>
      <h2>{{ out ? 'The captain is out fishing' : 'The captain is at the dock' }}</h2>
      <p class="trk__eta">Packaged in about <strong>{{ eta }}</strong></p>

      <div class="trk__scene" aria-hidden="true">
        <Transition name="trk-fade" mode="out-in">
          <svg v-if="scene === 'clean'" key="clean" viewBox="0 0 300 90">
            <rect class="trk__ice" x="0" y="0" width="300" height="90" />
            <circle v-for="n in 9" :key="n" class="trk__snow" :cx="20 + n * 30" cy="0" r="2.6" :style="{ animationDelay: `${n * -0.45}s` }" />
            <path class="trk__board" d="M70 62 H230 L222 76 H78 Z" />
            <g class="trk__fillet"><path d="M100 58 Q150 36 200 58 Q150 70 100 58 Z" /><path class="trk__fillet-line" d="M112 57 Q150 45 188 57" /></g>
          </svg>
          <svg v-else-if="scene === 'pack'" key="pack" viewBox="0 0 300 90">
            <rect class="trk__shed" x="0" y="0" width="300" height="90" />
            <path class="trk__bench" d="M0 70 H300 V90 H0 Z" />
            <g class="trk__drop"><path d="M130 14 Q150 4 170 14 Q150 24 130 14 Z M170 14 L178 8 V20 Z" /></g>
            <path class="trk__box" d="M100 40 H200 V74 H100 Z" />
            <path class="trk__flap trk__flap--l" d="M100 40 L124 28 L150 40 Z" />
            <path class="trk__flap trk__flap--r" d="M200 40 L176 28 L150 40 Z" />
            <path class="trk__tape" d="M146 40 H154 V74 H146 Z" />
          </svg>
          <svg v-else-if="scene === 'ship'" key="ship" viewBox="0 0 300 90">
            <rect class="trk__sky" x="0" y="0" width="300" height="90" />
            <path class="trk__cloud trk__cloud--a" d="M40 24 Q48 14 60 20 Q70 12 78 24 Z" />
            <path class="trk__cloud trk__cloud--b" d="M190 14 Q198 6 208 12 Q216 6 224 14 Z" />
            <path class="trk__hills" d="M0 62 Q50 40 100 58 T200 56 T300 58 V90 H0 Z" />
            <path class="trk__road" d="M0 72 H300 V84 H0 Z" />
            <path class="trk__dash" d="M0 78 H300" />
            <g class="trk__van">
              <path d="M110 48 H170 V68 H110 Z" />
              <path class="trk__cab" d="M170 54 H188 L196 62 V68 H170 Z" />
              <circle class="trk__wheel" cx="126" cy="70" r="6" />
              <circle class="trk__wheel" cx="182" cy="70" r="6" />
            </g>
          </svg>
          <svg v-else key="water" viewBox="0 0 300 90">
            <circle class="trk__sun" cx="250" cy="22" r="10" />
            <path class="trk__wave" d="M0 66 Q20 58 40 66 T80 66 T120 66 T160 66 T200 66 T240 66 T280 66 T320 66 T360 66 T400 66 V90 H0 Z" />
            <g class="trk__boat">
              <path d="M110 56 H170 L160 70 H120 Z" />
              <path d="M138 56 V30 L158 56 Z" />
            </g>
            <g class="trk__fish"><path transform="translate(96 0) scale(-1 1)" d="M30 78 Q44 70 58 78 Q44 86 30 78 Z M58 78 L66 72 V84 Z" /></g>
          </svg>
        </Transition>
      </div>

      <ul class="trk__facts">
        <li>Boat: {{ boat.name || 'F/V Sample' }}</li>
        <li>{{ status.place }}</li>
        <li>{{ status.weather.sky }}, {{ status.weather.temp }}&deg;F, wind {{ status.weather.wind }} kt, seas {{ status.weather.sea }}</li>
      </ul>

      <ol class="trk__steps">
        <li v-for="s in steps" :key="s.key" :class="{ done: s.done, now: s.now, peek: s.scene }" :tabindex="s.scene ? 0 : undefined" @mouseenter="hover = s.scene || ''" @mouseleave="hover = ''" @focus="hover = s.scene || ''" @blur="hover = ''"><span></span>{{ s.label }}</li>
      </ol>

      <p class="trk__note">{{ live ? 'Live from the boat.' : 'Sample status. Connect your boat in Inventory to make this live.' }}</p>
    </div>
  </div>
</template>

<style scoped>
.trk { position: fixed; inset: 0; z-index: 50; display: grid; place-items: center; background: rgba(15, 32, 75, 0.5); padding: 1rem; }
.trk__card { position: relative; width: min(30rem, 100%); max-height: 92vh; overflow: auto; background: #fbf1d8; color: #2c3b40; border-radius: 1rem; padding: 2.4rem 2.2rem; font-family: Lora, Georgia, serif; }
.trk__x { position: absolute; top: 0.6rem; right: 0.9rem; border: 0; background: none; font-size: 1.6rem; cursor: pointer; color: #2c3b40; }
.trk__id { font-size: 0.8rem; opacity: 0.6; margin: 0; }
.trk--inline { position: static; display: block; padding: 0; background: none; }
.trk--inline .trk__card { width: 100%; max-height: none; box-sizing: border-box; background: #fffaf0; }
.trk h2 { font-family: Pacifico, cursive; font-weight: 400; color: #2f5d5b; margin: 0.2rem 0 0.4rem; font-size: 1.5rem; }
.trk__eta { margin: 0 0 1rem; }
.trk__scene { margin: 0 -2.2rem; background: linear-gradient(#cfe3df, #cfe3df); border-radius: 0; overflow: hidden; -webkit-mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent), linear-gradient(transparent, #000 18%, #000 82%, transparent); -webkit-mask-composite: source-in; mask-image: linear-gradient(to right, transparent, #000 12%, #000 88%, transparent), linear-gradient(transparent, #000 18%, #000 82%, transparent); mask-composite: intersect; }
.trk__scene svg { display: block; width: 100%; }
.trk__sun { fill: #f3c871; }
.trk__wave { fill: #3f7a78; opacity: 0.8; animation: trk-wave 4s linear infinite; }
.trk__boat { fill: #b4533f; animation: trk-bob 3s ease-in-out infinite; transform-box: fill-box; }
.trk__fish { fill: #f2a58f; animation: trk-swim 5s ease-in-out infinite; }
.trk__ice { fill: #dcebf0; }
.trk__snow { fill: #fff; animation: trk-snow 3.6s linear infinite; }
.trk__board { fill: #c99a62; }
.trk__fillet { fill: #f2a58f; animation: trk-chill 2.4s ease-in-out infinite; }
.trk__fillet-line { fill: none; stroke: #fbd9cc; stroke-width: 3; stroke-linecap: round; }
.trk__shed { fill: #ecdfc2; }
.trk__bench { fill: #b98d58; }
.trk__box { fill: #d9ac72; }
.trk__flap { fill: #c99a62; transform-box: fill-box; animation: trk-flap 3s ease-in-out infinite; }
.trk__flap--l { transform-origin: 0% 100%; }
.trk__flap--r { transform-origin: 100% 100%; animation-name: trk-flap-r; }
.trk__tape { fill: #b4533f; opacity: 0.55; }
.trk__drop { fill: #f2a58f; animation: trk-drop 3s ease-in infinite; }
.trk-fade-enter-active, .trk-fade-leave-active { transition: opacity 0.2s ease; }
.trk-fade-enter-from, .trk-fade-leave-to { opacity: 0; }
@keyframes trk-snow { from { transform: translateY(-6px); opacity: 0; } 15% { opacity: 1; } to { transform: translateY(96px); opacity: 0.9; } }
@keyframes trk-chill { 50% { transform: translateY(-1.5px); } }
@keyframes trk-drop { 0% { transform: translateY(0); } 45% { transform: translateY(40px); opacity: 1; } 55%, 100% { transform: translateY(40px); opacity: 0; } }
@keyframes trk-flap { 0%, 45% { transform: rotate(-60deg); } 70%, 100% { transform: rotate(0deg); } }
@keyframes trk-flap-r { 0%, 45% { transform: rotate(60deg); } 70%, 100% { transform: rotate(0deg); } }
.trk__sky { fill: #d6e6ee; }
.trk__cloud { fill: #fff; opacity: 0.85; animation: trk-cloud 14s linear infinite; }
.trk__cloud--b { animation-duration: 20s; }
.trk__hills { fill: #b7d2a5; }
.trk__road { fill: #8a8f94; }
.trk__dash { fill: none; stroke: #f4ead0; stroke-width: 2; stroke-dasharray: 14 12; animation: trk-road 0.8s linear infinite; }
.trk__van { fill: #f4ead0; animation: trk-van 1.2s ease-in-out infinite; }
.trk__van .trk__cab { fill: #e7d8b4; }
.trk__wheel { fill: #2f5d5b; }
@keyframes trk-cloud { from { transform: translateX(-30px); } to { transform: translateX(60px); } }
@keyframes trk-road { to { stroke-dashoffset: 26; } }
@keyframes trk-van { 50% { transform: translateY(-1.5px); } }
.trk__steps li.peek { cursor: default; }
.trk__steps li.peek:hover, .trk__steps li.peek:focus-visible { opacity: 1; outline: none; }
@keyframes trk-wave { to { transform: translateX(-40px); } }
@keyframes trk-bob { 50% { transform: translateY(-3px) rotate(2deg); } }
@keyframes trk-swim { 50% { transform: translateX(14px); } }
.trk__facts { list-style: none; padding: 0; margin: 1rem 0; font-size: 0.92rem; line-height: 1.7; }
.trk__steps { list-style: none; padding: 0; margin: 0; }
.trk__steps li { display: flex; align-items: center; gap: 0.7rem; padding: 0.35rem 0; opacity: 0.45; }
.trk__steps li span { width: 0.8rem; height: 0.8rem; border-radius: 50%; border: 2px solid #3f7a78; }
.trk__steps li.done { opacity: 1; }
.trk__steps li.done span { background: #3f7a78; }
.trk__steps li.now span { box-shadow: 0 0 0 4px rgba(63, 122, 120, 0.25); }
.trk__note { font-size: 0.8rem; opacity: 0.65; margin: 1rem 0 0; }
@media (prefers-reduced-motion: reduce) { .trk__wave, .trk__boat, .trk__fish, .trk__snow, .trk__fillet, .trk__flap, .trk__drop, .trk__cloud, .trk__dash, .trk__van { animation: none; } }
</style>
