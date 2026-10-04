import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import test from 'node:test';

import { createInventoryStore } from './inventory.js';

const make = (extra = {}) => {
  const calls = [];
  const fetchImpl = async (url, init) => { calls.push({ url, init }); return { ok: true, status: 200 }; };
  return createInventoryStore({ uri: '', webhookUrl: 'https://example.test/hook', fetchImpl, ...extra }).then((store) => ({ store, calls }));
};
const flush = () => new Promise((r) => setImmediate(r));

test('adds, then updates, an item by name', async () => {
  const { store } = await make();
  const first = await store.save([{ name: 'King salmon', lbs: 200, price: 14 }]);
  assert.equal(first.items[0].action, 'added');
  const second = await store.save([{ name: 'king salmon', lbs: 150 }]);
  assert.equal(second.items[0].action, 'updated');
  const [row] = await store.list();
  assert.equal(row.lbs, 150);
  assert.equal(row.price, 14);
});

test('rejects bad items', async () => {
  const { store } = await make();
  assert.equal((await store.save([])).error, 'invalid');
  assert.equal((await store.save([{ name: '' }])).error, 'invalid');
  assert.equal((await store.save([{ name: 'Coho', lbs: -3 }])).error, 'invalid');
});

test('posts a webhook when items are added, and skips it when asked', async () => {
  const { store, calls } = await make();
  await store.save([{ name: 'Halibut', lbs: 50, price: 18 }], { notifyCustomers: true });
  await flush();
  assert.equal(calls.length, 1);
  const body = JSON.parse(calls[0].init.body);
  assert.equal(body.event, 'inventory.updated');
  assert.equal(body.notifyCustomers, true);
  assert.equal(body.items[0].name, 'Halibut');
  await store.save([{ name: 'Halibut', lbs: 40 }], { webhook: false });
  await flush();
  assert.equal(calls.length, 1);
});

test('signs the webhook body when a secret is set', async () => {
  const { store, calls } = await make({ webhookSecret: 's3cret' });
  await store.save([{ name: 'Coho', lbs: 10, price: 11 }]);
  await flush();
  const { body, headers } = calls[0].init;
  assert.equal(headers['X-Deckhand-Signature'], `sha256=${createHmac('sha256', 's3cret').update(body).digest('hex')}`);
});

test('a failing webhook does not fail the save', async () => {
  const { store } = await make({ fetchImpl: async () => { throw new Error('down'); } });
  const result = await store.save([{ name: 'Sockeye', lbs: 5 }]);
  assert.equal(result.items.length, 1);
  await flush();
});

test('reports the previous stock and emits a change event', async () => {
  const { store } = await make();
  let events = 0;
  store.events.on('change', () => { events += 1; });
  const first = await store.save([{ name: 'Coho', lbs: 0, price: 11 }]);
  assert.equal(first.items[0].previousLbs, null);
  const restock = await store.save([{ name: 'coho', lbs: 30 }]);
  assert.equal(restock.items[0].previousLbs, 0);
  assert.equal(events, 2);
  await store.remove('Coho');
  assert.equal(events, 3);
});

test('removes an item', async () => {
  const { store } = await make();
  await store.save([{ name: 'Lingcod', lbs: 5 }]);
  assert.equal(await store.remove('LINGCOD'), true);
  assert.equal(await store.remove('Lingcod'), false);
});
