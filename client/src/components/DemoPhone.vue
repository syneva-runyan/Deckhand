<script setup>
// A phone on screen that shows every text the server sends, so a demo can show customers getting them.
import { nextTick, onBeforeUnmount, onMounted, ref } from 'vue';

const messages = ref([]);
const open = ref(true);
const unread = ref(0);
const screen = ref(null);
let stream;

onMounted(() => {
  if (!('EventSource' in window)) return;
  stream = new EventSource('/api/sms/stream');
  stream.onmessage = async (e) => {
    const m = JSON.parse(e.data);
    if (messages.value.some((x) => x.id === m.id)) return;
    messages.value.push(m);
    if (!open.value) unread.value += 1;
    await nextTick();
    if (screen.value) screen.value.scrollTop = screen.value.scrollHeight;
  };
});
onBeforeUnmount(() => stream && stream.close());

const time = (iso) => new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
function toggle() {
  open.value = !open.value;
  if (open.value) unread.value = 0;
}
</script>

<template>
  <aside class="dp" aria-label="Demo phone showing text messages">
    <div v-if="open" class="dp__phone">
      <div class="dp__notch"></div>
      <div class="dp__head">Messages <span>Off the Rock</span></div>
      <div ref="screen" class="dp__screen" aria-live="polite">
        <p v-if="!messages.length" class="dp__empty">Texts to customers show up here.</p>
        <TransitionGroup name="dp-msg">
          <div v-for="m in messages" :key="m.id" class="dp__msg">
            <small>To {{ m.to }} · {{ time(m.at) }}</small>
            <p>
              <template v-for="(part, i) in m.body.split(/(https?:\/\/\S+)/)" :key="i">
                <a v-if="/^https?:\/\//.test(part)" :href="part" target="_blank" rel="noopener">Order now</a>
                <template v-else>{{ part }}</template>
              </template>
            </p>
          </div>
        </TransitionGroup>
      </div>
    </div>
    <button type="button" class="dp__toggle" @click="toggle">
      {{ open ? 'Hide phone' : 'Show phone' }}<span v-if="unread" class="dp__badge">{{ unread }}</span>
    </button>
  </aside>
</template>

<style scoped>
.dp { position: fixed; left: 1rem; bottom: 1rem; z-index: 90; display: flex; flex-direction: column; align-items: flex-start; gap: 0.5rem; font-family: system-ui, sans-serif; }
.dp__phone { width: 16rem; height: 26rem; display: flex; flex-direction: column; background: #111; border: 6px solid #111; border-radius: 28px; box-shadow: 0 16px 40px rgba(0, 0, 0, 0.4); overflow: hidden; }
.dp__notch { align-self: center; width: 5rem; height: 0.9rem; margin-bottom: -0.1rem; background: #111; border-radius: 0 0 12px 12px; }
.dp__head { display: flex; justify-content: space-between; padding: 0.4rem 0.8rem; background: #f2f2f7; color: #111; font-weight: 700; font-size: 0.85rem; }
.dp__head span { font-weight: 400; color: #666; }
.dp__screen { flex: 1; overflow-y: auto; padding: 0.7rem; background: #fff; display: flex; flex-direction: column; gap: 0.6rem; }
.dp__empty { margin: auto; text-align: center; color: #888; font-size: 0.85rem; }
.dp__msg small { display: block; margin: 0 0 0.15rem 0.4rem; color: #888; font-size: 0.65rem; }
.dp__msg p { margin: 0; max-width: 90%; padding: 0.5rem 0.7rem; background: #e9e9eb; color: #111; border-radius: 16px 16px 16px 4px; font-size: 0.85rem; line-height: 1.3; }
.dp__msg a { display: inline-block; margin: 0.2rem 0; padding: 0.25rem 0.8rem; border-radius: 999px; background: #d6684f; color: #fff; font-weight: 700; text-decoration: none; }
.dp__toggle { position: relative; padding: 0.4rem 0.9rem; border: 0; border-radius: 999px; background: #0f204b; color: #fff; font: inherit; font-size: 0.85rem; cursor: pointer; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3); }
.dp__badge { margin-left: 0.4rem; padding: 0 0.4rem; border-radius: 999px; background: #ffb612; color: #0f204b; font-weight: 700; }
.dp-msg-enter-active { transition: transform 0.4s cubic-bezier(0.2, 0.9, 0.3, 1.2), opacity 0.3s ease; }
.dp-msg-enter-from { opacity: 0; transform: translateY(1rem) scale(0.95); }
@media (max-width: 40rem) { .dp__phone { width: 13rem; height: 20rem; } }
@media (prefers-reduced-motion: reduce) { .dp-msg-enter-active { transition: opacity 0.2s ease; } .dp-msg-enter-from { transform: none; } }
</style>
