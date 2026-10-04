<script setup>
// Where the collective builds its site: a few facts about the catch on the
// left, a live preview and what the catch is worth on the right.
import { onMounted, reactive, ref, watch } from 'vue';

import { api } from '../api.js';
import FishMark from '../components/FishMark.vue';
import SiteSign from '../components/SiteSign.vue';
import WorthCard from '../components/WorthCard.vue';

const form = reactive({
  collective: '',
  port: 'juneau',
  boat: '',
  species: '',
  grounds: '',
  pounds: 0,
  directPrice: 0,
  dockPrice: 0,
  when: '',
  status: 'ahead',
});

const options = ref(null);
const kit = ref(null);
const site = ref(null);
const error = ref('');
const copied = ref(false);

const siteLink = (slug) => `${window.location.origin}/s/${slug}`;

async function preview() {
  try {
    kit.value = await api.kit(form);
    error.value = '';
  } catch {
    error.value = 'The preview could not be updated. Is the API running?';
  }
}

let timer;
watch(form, () => {
  site.value = null;
  clearTimeout(timer);
  timer = setTimeout(preview, 200);
});

onMounted(async () => {
  try {
    options.value = await api.options();
    Object.assign(form, options.value.sample);
    await preview();
  } catch {
    error.value = 'Could not reach the API. Start it with "npm run dev".';
  }
});

async function createSite() {
  try {
    site.value = await api.saveSite(form);
    copied.value = false;
    error.value = '';
  } catch {
    error.value = 'The site could not be created. Try again.';
  }
}

async function copyPost() {
  try {
    await navigator.clipboard.writeText(site.value.post);
    copied.value = true;
  } catch {
    copied.value = false;
    error.value = 'Copying is blocked in this browser. Select the text and copy it by hand.';
  }
}
</script>

<template>
  <div class="page page--builder">
    <header class="topbar">
      <FishMark class="topbar__mark" />
      <div>
        <p class="topbar__name">DECKHAND</p>
        <p class="topbar__tag">MORE DECK. LESS DESK.</p>
      </div>
    </header>

    <main class="builder">
      <section class="builder__intro">
        <h1>Build your collective's site in a minute.</h1>
        <p>
          Tell us about the catch. Deckhand writes the page, takes the orders and shows each buyer
          where their fish is, from the water to their door.
        </p>
      </section>

      <p v-if="error" class="error" role="alert">{{ error }}</p>

      <div v-if="options" class="builder__grid">
        <form class="card form" @submit.prevent="createSite">
          <h2 class="card__title">Your catch</h2>

          <label class="field">
            <span>Collective name</span>
            <input v-model="form.collective" type="text" maxlength="60" required />
          </label>

          <div class="field-row">
            <label class="field">
              <span>Home port</span>
              <select v-model="form.port">
                <option v-for="port in options.ports" :key="port.id" :value="port.id">{{ port.name }}</option>
              </select>
            </label>
            <label class="field">
              <span>Boat</span>
              <input v-model="form.boat" type="text" maxlength="40" required />
            </label>
          </div>

          <div class="field-row">
            <label class="field">
              <span>Species</span>
              <input v-model="form.species" type="text" maxlength="40" list="species" required />
              <datalist id="species">
                <option v-for="name in options.species" :key="name" :value="name"></option>
              </datalist>
            </label>
            <label class="field">
              <span>Where it's caught</span>
              <input v-model="form.grounds" type="text" maxlength="40" />
            </label>
          </div>

          <div class="field-row">
            <label class="field">
              <span>Pounds to sell</span>
              <input v-model.number="form.pounds" type="number" min="0" step="1" />
            </label>
            <label class="field">
              <span>Landing</span>
              <input v-model="form.when" type="text" maxlength="40" placeholder="Saturday" />
            </label>
          </div>

          <div class="field-row">
            <label class="field">
              <span>Your direct price ($/lb)</span>
              <input v-model.number="form.directPrice" type="number" min="0" step="0.25" />
            </label>
            <label class="field">
              <span>Dock price ($/lb)</span>
              <input v-model.number="form.dockPrice" type="number" min="0" step="0.05" />
            </label>
          </div>

          <fieldset class="field">
            <legend>Where things stand</legend>
            <div class="segmented">
              <label v-for="status in options.statuses" :key="status.id" :class="{ 'is-on': form.status === status.id }">
                <input v-model="form.status" type="radio" name="status" :value="status.id" />
                <strong>{{ status.label }}</strong>
                <small>{{ status.hint }}</small>
              </label>
            </div>
          </fieldset>

          <p class="note">The form starts with sample numbers. Replace them with your own.</p>
          <button class="button" type="submit">Create our site</button>
        </form>

        <div class="builder__side">
          <section v-if="site" class="card created">
            <h2 class="card__title">Your site is live</h2>
            <p>
              <a class="created__link" :href="`/s/${site.slug}`">{{ siteLink(site.slug) }}</a>
            </p>
            <p class="created__label">A post to share it</p>
            <pre class="created__post">{{ site.post }}</pre>
            <button class="button button--quiet" type="button" @click="copyPost">
              {{ copied ? 'Copied' : 'Copy post' }}
            </button>
          </section>

          <template v-if="kit">
            <p class="eyebrow">Preview</p>
            <SiteSign :sign="kit.sign" />
            <p v-if="!kit.port.checkedByLocal" class="note">
              The {{ kit.port.name }} line is a draft. Have someone local check it before it goes out.
            </p>
            <WorthCard :worth="kit.worth" />
          </template>

          <p class="note">
            See it working:
            <a :href="`/s/${options.demo.slug}`">sample site</a> ·
            <a :href="`/order/${options.demo.orderId}`">sample order tracker</a>
          </p>
        </div>
      </div>
    </main>
  </div>
</template>
