import assert from 'node:assert/strict';
import test from 'node:test';

import { createSubscribersStore } from './subscribers.js';

test('adds a number once and normalizes it', async () => {
  const store = await createSubscribersStore({ uri: '' });
  assert.equal((await store.add('(555) 123-4567')).created, true);
  assert.equal((await store.add('+1 555 123 4567')).created, false);
  assert.deepEqual(await store.list(), ['5551234567']);
});

test('rejects numbers that are not 10 digits', async () => {
  const store = await createSubscribersStore({ uri: '' });
  assert.equal((await store.add('12345')).error, 'invalid');
});

test('removes a number', async () => {
  const store = await createSubscribersStore({ uri: '' });
  await store.add('5551234567');
  assert.equal(await store.remove('(555) 123-4567'), true);
  assert.deepEqual(await store.list(), []);
});
