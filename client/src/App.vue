<script setup>
// Pages, picked from the address. Links between them are plain links,
// so there is no router to learn:
//   /            landing page, the ad for independent fishermen
//   /app/...     the dashboard: orders, brand and website
//   /example     a sample storefront, for touring
//   /example/order/:id   the sample order confirmation and tracker
//   /s/:slug     the collective's site, where a buyer orders
//   /order/:id   the buyer follows their fish
import DashboardPage from './pages/DashboardPage.vue';
import ExampleStorePage from './pages/ExampleStorePage.vue';
import ExampleOrderPage from './pages/ExampleOrderPage.vue';
import LandingPage from './pages/LandingPage.vue';
import OrderPage from './pages/OrderPage.vue';
import StorePage from './pages/StorePage.vue';

const path = window.location.pathname;
const store = path.match(/^\/s\/([a-z0-9-]+)\/?$/);
const dashboard = /^\/app(\/|$)/.test(path);
const example = /^\/example\/?$/.test(path);
const exampleOrder = path.match(/^\/example\/order\/([a-z0-9-]+)\/?$/i);
const order = path.match(/^\/order\/([a-z0-9-]+)\/?$/);
</script>

<template>
  <ExampleStorePage v-if="example" />
  <ExampleOrderPage v-else-if="exampleOrder" :id="exampleOrder[1]" />
  <StorePage v-else-if="store" :slug="store[1]" />
  <OrderPage v-else-if="order" :id="order[1]" />
  <DashboardPage v-else-if="dashboard" />
  <LandingPage v-else />
</template>
