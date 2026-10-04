import { test } from 'node:test';
import assert from 'node:assert/strict';

import { sample } from './ports.js';
import { createStore, STAGES } from './store.js';

test('saving a site gives it an address made from the collective name', () => {
  const store = createStore();
  const site = store.saveSite({ ...sample, collective: "Out the Road Fishermen's Co-op!" });

  assert.equal(site.slug, 'out-the-road-fishermen-s-co-op');
  assert.equal(site.remaining, 200);
  assert.equal(site.sign.headline, 'FISH AHEAD');
  assert.equal(store.getSite('nope'), null);
});

test('a pre-order starts with the fish still swimming', () => {
  const store = createStore();
  const { slug } = store.saveSite({ ...sample, status: 'ahead' });
  const { order } = store.placeOrder(slug, { name: 'Ana', pounds: 10 });

  assert.equal(order.stage, 'swimming');
  assert.equal(order.total, 120);
  assert.match(order.message, /still out in Taku Inlet/);
  assert.equal(store.getSite(slug).remaining, 190);
});

test('an order on a landed catch starts at caught', () => {
  const store = createStore();
  const { slug } = store.saveSite({ ...sample, status: 'landing' });
  const { order } = store.placeOrder(slug, { name: 'Ana', pounds: 5 });

  assert.equal(order.stage, 'caught');
});

test('buying the last of the catch sells the site out', () => {
  const store = createStore();
  const { slug } = store.saveSite({ ...sample, pounds: 20 });

  const first = store.placeOrder(slug, { pounds: 50 });
  assert.equal(first.order.pounds, 20, 'an order is capped at what is left');

  const site = store.getSite(slug);
  assert.equal(site.remaining, 0);
  assert.equal(site.status, 'soldout');
  assert.equal(site.sign.headline, 'SOLD OUT');

  assert.deepEqual(store.placeOrder(slug, { pounds: 1 }), { error: 'sold-out' });
});

test('orders are refused for a missing site or a bad amount', () => {
  const store = createStore();
  const { slug } = store.saveSite(sample);

  assert.deepEqual(store.placeOrder('nope', { pounds: 1 }), { error: 'not-found' });
  assert.deepEqual(store.placeOrder(slug, { pounds: 0 }), { error: 'bad-amount' });
  assert.deepEqual(store.placeOrder(slug, { pounds: 'some' }), { error: 'bad-amount' });
});

test('an order advances through every stage and stops at shipped', () => {
  const store = createStore();
  const { slug } = store.saveSite(sample);
  const { order } = store.placeOrder(slug, { name: 'Ana', pounds: 10 });

  const seen = [order.stage];
  let current = order;
  for (let i = 0; i < STAGES.length + 2; i += 1) {
    current = store.advanceOrder(order.id, { carrier: 'ups', number: '1Z999' });
    seen.push(current.stage);
  }

  assert.deepEqual(seen.slice(0, 5), ['swimming', 'caught', 'processing', 'packing', 'shipped']);
  assert.equal(current.stage, 'shipped');
  assert.equal(current.tracking.carrier, 'UPS');
  assert.equal(current.tracking.number, '1Z999');
  assert.equal(current.tracking.isSample, false);
  assert.match(current.tracking.url, /ups\.com\/track\?tracknum=1Z999/);
});

test('shipping without a tracking number is marked as a sample', () => {
  const store = createStore();
  const { orderId } = store.seed();

  let order;
  for (let i = 0; i < 4; i += 1) order = store.advanceOrder(orderId);

  assert.equal(order.stage, 'shipped');
  assert.equal(order.tracking.isSample, true);
  assert.equal(order.tracking.carrier, 'Alaska Air Cargo');

  const reset = store.resetOrder(orderId);
  assert.equal(reset.stage, 'swimming');
  assert.equal(reset.tracking, null);
});

test('the seeded demo site and order exist at fixed addresses', () => {
  const store = createStore();
  const { slug, orderId } = store.seed();

  assert.equal(slug, 'sample-harbor-collective');
  assert.equal(orderId, 'demo');
  assert.equal(store.getSite(slug).remaining, 190);
  assert.equal(store.getOrder('demo').name, 'Sam');
  assert.equal(store.getOrder('missing'), null);
  assert.equal(store.advanceOrder('missing'), null);
});
