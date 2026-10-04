<script setup>
// Pages, picked from the address. Links between them are plain links,
// so there is no router to learn:
//   /            landing page, the ad for independent fishermen
//   /s/:slug     the collective's site, where a buyer orders
//   /order/:id   the buyer follows their fish
import LandingPage from './pages/LandingPage.vue';
import OrderPage from './pages/OrderPage.vue';
import StorePage from './pages/StorePage.vue';

const path = window.location.pathname;
const store = path.match(/^\/s\/([a-z0-9-]+)\/?$/);
const order = path.match(/^\/order\/([a-z0-9-]+)\/?$/);
</script>

<template>
  <StorePage v-if="store" :slug="store[1]" />
  <OrderPage v-else-if="order" :id="order[1]" />
  <LandingPage v-else />
</template>
