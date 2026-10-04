<script setup>
// The collective's own site. A buyer reads what's on offer and orders.
import { computed, onMounted, reactive, ref } from 'vue';

import { api, money } from '../api.js';
import SiteSign from '../components/SiteSign.vue';

const props = defineProps({
  slug: { type: String, required: true },
});

const site = ref(null);
const error = ref('');
const buying = ref(false);
const order = reactive({ name: '', pounds: 5 });

const soldOut = computed(() => site.value.status === 'soldout' || site.value.remaining <= 0);
const total = computed(() => Math.round((Number(order.pounds) || 0) * site.value.directPrice * 100) / 100);

async function load() {
  try {
    site.value = await api.site(props.slug);
    order.pounds = Math.min(order.pounds, site.value.remaining) || 1;
  } catch (e) {
    error.value = e.status === 404 ? 'This site does not exist yet.' : 'The site could not be loaded.';
  }
}

onMounted(load);

async function buy() {
  buying.value = true;
  try {
    const placed = await api.buy(props.slug, order);
    window.location.href = `/order/${placed.id}`;
  } catch (e) {
    buying.value = false;
    if (e.code === 'sold-out') {
      await load();
    } else {
      error.value = 'The order did not go through. Check the amount and try again.';
    }
  }
}
</script>

<template>
  <div class="page page--store">
    <p v-if="error" class="error" role="alert">{{ error }}</p>

    <template v-if="site">
      <header class="store__head">
        <p class="store__name">{{ site.collective }}</p>
        <p class="store__port">{{ site.port.name }}, Alaska</p>
      </header>

      <main class="store">
        <SiteSign :sign="site.sign" />

        <section v-if="soldOut" class="card buy">
          <h2 class="card__title">Every pound is spoken for</h2>
          <p>Thank you, {{ site.port.name }}. The next trip will be posted here.</p>
        </section>

        <form v-else class="card buy" @submit.prevent="buy">
          <h2 class="card__title">Buy direct from {{ site.boat }}</h2>
          <p class="buy__facts">
            {{ site.species }} from {{ site.grounds }} · {{ money(site.directPrice) }}/lb ·
            {{ site.remaining }} lb left
          </p>

          <div class="field-row">
            <label class="field">
              <span>First name</span>
              <input v-model="order.name" type="text" maxlength="30" required />
            </label>
            <label class="field">
              <span>Pounds</span>
              <input v-model.number="order.pounds" type="number" min="1" :max="site.remaining" step="1" required />
            </label>
          </div>

          <button class="button" type="submit" :disabled="buying">
            Buy {{ order.pounds || 0 }} lb · {{ money(total) }}
          </button>
          <p class="note">Prototype: no payment is taken and nothing ships.</p>
        </form>
      </main>

      <footer class="made-with">Made with <a href="/">Deckhand</a></footer>
    </template>
  </div>
</template>
