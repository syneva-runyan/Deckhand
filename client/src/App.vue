<script setup>
// Three pages, picked from the address. Links between them are plain links,
// so there is no router to learn:
//   /            the collective builds its site
//   /s/:slug     the collective's site, where a buyer orders
//   /order/:id   the buyer follows their fish
import BuilderPage from './pages/BuilderPage.vue';
import OrderPage from './pages/OrderPage.vue';
import StorePage from './pages/StorePage.vue';

const path = window.location.pathname;
const store = path.match(/^\/s\/([a-z0-9-]+)\/?$/);
const order = path.match(/^\/order\/([a-z0-9-]+)\/?$/);
</script>

<template>
  <StorePage v-if="store" :slug="store[1]" />
  <OrderPage v-else-if="order" :id="order[1]" />
  <BuilderPage v-else />
</template>
