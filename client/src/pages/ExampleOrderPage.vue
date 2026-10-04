<script setup>
import { ref } from 'vue';
import OrderTracker from '../components/OrderTracker.vue';
import WatercolorBackdrop from '../components/WatercolorBackdrop.vue';

const props = defineProps({ id: { type: String, required: true } });

// The last sample order is kept so the confirmation link keeps working after a refresh.
let saved = null;
try { saved = JSON.parse(localStorage.getItem('deckhand-example-order') || 'null'); } catch { /* ignore */ }
// A built-in example, so the sample link always works. A real sample purchase replaces it.
const SAMPLE = { id: 'DH-4821', product: { name: 'King salmon fillets', price: '24.00' }, lbs: 5, total: '120.00', email: 'you@example.com', last4: '4242' };
const match = (o) => o && o.id.toLowerCase() === props.id.toLowerCase();
const order = ref(match(saved) ? saved : match(SAMPLE) ? SAMPLE : null);
</script>

<template>
  <div class="eo">
    <WatercolorBackdrop />
    <main class="eo__body">
    <template v-if="order">
      <h1>Thank you. Order {{ order.id }} is in.</h1>
      <p>{{ order.lbs }} lb {{ order.product.name }}, ${{ order.total }}. A receipt is on its way to {{ order.email }} (sample, nothing was sent or charged).</p>
      <OrderTracker :order="order" inline />
    </template>
    <template v-else>
      <h1>We can't find that order.</h1>
      <p>This is a sample storefront, and orders only live in the browser that placed them.</p>
    </template>
    <p class="eo__back"><a href="/example">Back to Off the Rock</a></p>
    </main>
  </div>
</template>

<style scoped>
.eo { position: relative; min-height: 100vh; overflow-x: hidden; background: #f8eed6; color: #2c3b40; font-family: Lora, Georgia, serif; }
.eo__body { position: relative; z-index: 1; max-width: 34rem; margin: 0 auto; padding: 3.5rem 1.75rem 4rem; }
.eo__body > h1 { margin: 0 0 1rem; }
.eo__body > p { line-height: 1.6; margin: 0 0 1.75rem; }
.eo__body > .eo__back { margin: 2.5rem 0 0; }
.eo h1 { font-family: Pacifico, cursive; font-weight: 400; color: #2f5d5b; font-size: 1.7rem; }
.eo a { color: #b4533f; }
</style>
