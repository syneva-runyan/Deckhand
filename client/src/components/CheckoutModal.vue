<script setup>
import { computed, ref } from 'vue';

const props = defineProps({ product: { type: Object, required: true } });
const emit = defineEmits(['close', 'paid']);

// A look-alike of a Stripe card form. Nothing is sent or stored. A real build would use Stripe
// Elements or Checkout, so card numbers never touch our own server.
const lbs = ref(5);
const name = ref('');
const email = ref('');
const card = ref('');
const exp = ref('');
const cvc = ref('');
const zip = ref('');
const error = ref('');
const paying = ref(false);

const total = computed(() => (lbs.value * Number(props.product.price)).toFixed(2));

const onCard = () => {
  card.value = card.value.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();
};
const onExp = () => {
  const d = exp.value.replace(/\D/g, '').slice(0, 4);
  exp.value = d.length > 2 ? `${d.slice(0, 2)} / ${d.slice(2)}` : d;
};

function pay() {
  const digits = card.value.replace(/\D/g, '');
  if (!name.value.trim() || !/\S+@\S+\.\S+/.test(email.value)) error.value = 'Add your name and a valid email.';
  else if (digits.length < 15) error.value = 'Check your card number.';
  else if (!/^\d\d \/ \d\d$/.test(exp.value)) error.value = 'Expiry should look like 08 / 29.';
  else if (!/^\d{3,4}$/.test(cvc.value)) error.value = 'Check the security code.';
  else if (!/^\d{5}$/.test(zip.value)) error.value = 'Enter a 5-digit ZIP.';
  else error.value = '';
  if (error.value) return;
  paying.value = true;
  setTimeout(() => {
    emit('paid', {
      id: `DH-${Math.floor(1000 + Math.random() * 9000)}`,
      product: props.product,
      lbs: lbs.value,
      total: total.value,
      email: email.value,
      name: name.value.trim(),
      last4: digits.slice(-4),
    });
  }, 1400);
}
</script>

<template>
  <div class="co" role="dialog" aria-modal="true" aria-labelledby="co-title" @keydown.esc="emit('close')">
    <form class="co__card" @submit.prevent="pay">
      <button type="button" class="co__x" aria-label="Close" @click="emit('close')">&times;</button>
      <h2 id="co-title">{{ product.name }}</h2>
      <p class="co__note">${{ product.price }} / lb</p>

      <div class="co__qty">
        <span>Pounds</span>
        <div>
          <button type="button" aria-label="Fewer" :disabled="lbs <= 1" @click="lbs--">&minus;</button>
          <strong>{{ lbs }}</strong>
          <button type="button" aria-label="More" :disabled="lbs >= 25" @click="lbs++">+</button>
        </div>
      </div>

      <label>Name<input v-model="name" type="text" autocomplete="name" /></label>
      <label>Email<input v-model="email" type="email" autocomplete="email" /></label>
      <label>Card number<input v-model="card" inputmode="numeric" autocomplete="cc-number" placeholder="4242 4242 4242 4242" @input="onCard" /></label>
      <div class="co__row">
        <label>Expiry<input v-model="exp" inputmode="numeric" autocomplete="cc-exp" placeholder="MM / YY" @input="onExp" /></label>
        <label>CVC<input v-model="cvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4" /></label>
        <label>ZIP<input v-model="zip" inputmode="numeric" autocomplete="postal-code" maxlength="5" /></label>
      </div>

      <p v-if="error" class="co__error" role="alert">{{ error }}</p>
      <button type="submit" class="co__pay" :disabled="paying">{{ paying ? 'Processing...' : `Pay $${total}` }}</button>
      <p class="co__test">Test mode. Nothing is charged and nothing is saved.</p>
    </form>
  </div>
</template>

<style scoped>
.co { position: fixed; inset: 0; z-index: 30; display: grid; place-items: center; padding: 1rem; background: rgba(20, 40, 44, 0.6); overflow-y: auto; }
.co__card { position: relative; box-sizing: border-box; width: min(100%, 26rem); max-height: 94vh; overflow-y: auto; display: grid; gap: 0.8rem; padding: 1.6rem; border-radius: 20px 26px 22px 28px / 26px 20px 28px 22px; background: #fbf4df; color: #2c3b40; box-shadow: 0 24px 60px rgba(0, 0, 0, 0.35); }
.co__x { position: absolute; top: 0.6rem; right: 0.9rem; font-size: 1.6rem; line-height: 1; border: 0; background: none; color: #647274; cursor: pointer; }
.co__card h2 { margin: 0; font-family: Pacifico, cursive; font-weight: 400; color: #2f5d5b; }
.co__note { margin: -0.4rem 0 0; color: #647274; }
.co__qty { display: flex; align-items: center; justify-content: space-between; }
.co__qty div { display: flex; align-items: center; gap: 0.9rem; }
.co__qty button { width: 2.2rem; height: 2.2rem; border-radius: 50%; border: 1px solid #b9c6c2; background: #fff; font-size: 1.2rem; cursor: pointer; color: #2f5d5b; }
.co__qty button:disabled { opacity: 0.4; cursor: default; }
.co label { display: grid; gap: 0.25rem; font-size: 0.85rem; color: #647274; }
.co input { box-sizing: border-box; width: 100%; min-width: 0; font: inherit; font-size: 1rem; padding: 0.65rem 0.8rem; border: 1px solid #c9d4d0; border-radius: 10px; background: #fff; color: #2c3b40; }
.co input:focus { outline: none; border-color: #7fb7b0; box-shadow: 0 0 0 3px rgba(127, 183, 176, 0.3); }
.co__row { display: grid; grid-template-columns: 1.4fr 1fr 1fr; gap: 0.6rem; }
.co__row label, .co__card label { min-width: 0; }
.co__error { margin: 0; color: #a33; font-size: 0.9rem; }
.co__pay { font: inherit; font-weight: 700; padding: 0.85rem; border: 0; border-radius: 999px; background: #d6684f; color: #fbf1d8; cursor: pointer; }
.co__pay:disabled { opacity: 0.7; cursor: default; }
.co__test { margin: 0; text-align: center; font-size: 0.8rem; color: #647274; }
</style>
