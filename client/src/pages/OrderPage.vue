<script setup>
// The buyer's tracking page: where their fish is right now, as an animation.
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue';

import { api, money } from '../api.js';
import Journey from '../components/Journey.vue';

const props = defineProps({
  id: { type: String, required: true },
});

const order = ref(null);
const options = ref(null);
const error = ref('');
const tracking = reactive({ carrier: '', number: '' });

const nextIsShipped = computed(() => order.value.stageIndex === order.value.stages.length - 2);
const finished = computed(() => order.value.stageIndex === order.value.stages.length - 1);

async function load() {
  try {
    order.value = await api.order(props.id);
    error.value = '';
  } catch (e) {
    error.value = e.status === 404 ? 'We could not find that order.' : 'The order could not be loaded.';
  }
}

// Check for updates every few seconds, so a phone showing this page follows
// along when the stage is changed from another screen.
let poll;
onMounted(async () => {
  await load();
  try {
    options.value = await api.options();
    tracking.carrier = options.value.carriers[0].id;
  } catch {
    // The page still works without the carrier list.
  }
  poll = setInterval(load, 4000);
});
onBeforeUnmount(() => clearInterval(poll));

async function advance() {
  try {
    order.value = await api.advance(props.id, nextIsShipped.value ? tracking : {});
  } catch {
    error.value = 'The order could not be updated. Try again.';
  }
}

async function reset() {
  try {
    order.value = await api.reset(props.id);
    tracking.number = '';
  } catch {
    error.value = 'The order could not be updated. Try again.';
  }
}
</script>

<template>
  <div class="page page--order">
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template v-if="order">
      <header class="store__head">
        <p class="store__name">{{ order.site.collective }}</p>
        <p class="store__port">Order for {{ order.name }} · {{ order.pounds }} lb · {{ money(order.total) }}</p>
      </header>

      <main class="order">
        <p class="order__stage" aria-live="polite">{{ order.stages[order.stageIndex].label }}</p>
        <p class="order__message">{{ order.message }}</p>

        <Journey :stage-index="order.stageIndex" />

        <ol class="steps">
          <li
            v-for="(stage, i) in order.stages"
            :key="stage.id"
            :class="{ 'is-done': i < order.stageIndex, 'is-now': i === order.stageIndex }"
          >
            {{ stage.label }}
          </li>
        </ol>

        <section v-if="order.tracking" class="card tracking">
          <h2 class="card__title">Track your box</h2>
          <p>
            {{ order.tracking.carrier }} · <strong>{{ order.tracking.number }}</strong>
          </p>
          <p>
            <a class="button" :href="order.tracking.url" target="_blank" rel="noopener">
              Track with {{ order.tracking.carrier }}
            </a>
          </p>
          <p v-if="order.tracking.isSample" class="note">
            This is a placeholder number. A real order shows the carrier's own tracking number here.
          </p>
        </section>

        <p class="order__slogan">
          <template v-for="part in order.site.slogan" :key="part.text"><span :class="{ accent: part.accent }">{{ part.text }}</span>{{ ' ' }}</template>
        </p>
      </main>

      <aside class="demo">
        <p class="demo__title">Demo controls</p>
        <p class="note">On a real site the fisherman moves the order along. Buyers never see this strip.</p>
        <div v-if="nextIsShipped && options" class="field-row">
          <label class="field">
            <span>Carrier</span>
            <select v-model="tracking.carrier">
              <option v-for="carrier in options.carriers" :key="carrier.id" :value="carrier.id">{{ carrier.name }}</option>
            </select>
          </label>
          <label class="field">
            <span>Tracking number</span>
            <input v-model="tracking.number" type="text" maxlength="40" placeholder="Leave empty for a placeholder" />
          </label>
        </div>
        <div class="demo__buttons">
          <button class="button" type="button" :disabled="finished" @click="advance">
            {{ finished ? 'Delivered to the carrier' : `Next: ${order.stages[order.stageIndex + 1].label}` }}
          </button>
          <button class="button button--quiet" type="button" @click="reset">Start over</button>
          <a class="button button--quiet" :href="`/s/${order.site.slug}`">Back to the site</a>
        </div>
      </aside>
    </template>
  </div>
</template>
