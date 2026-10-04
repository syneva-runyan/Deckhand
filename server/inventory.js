import { createHmac } from 'node:crypto';
import { EventEmitter } from 'node:events';

import { MongoClient } from 'mongodb';

// Inventory lives in the `inventory` collection when MONGODB_URI is set, and in memory otherwise.
// When INVENTORY_WEBHOOK_URL is set, every confirmed addition is POSTed there as JSON.
// With INVENTORY_WEBHOOK_SECRET set, the body is signed: X-Deckhand-Signature: sha256=<hmac of the raw body>.
// Every save also emits `change` on `events`, which the storefront's live stream listens to.
export async function createInventoryStore({
  uri = process.env.MONGODB_URI,
  dbName = process.env.MONGODB_DB || 'deckhand',
  webhookUrl = process.env.INVENTORY_WEBHOOK_URL,
  webhookSecret = process.env.INVENTORY_WEBHOOK_SECRET,
  fetchImpl = fetch,
} = {}) {
  let collection = null;
  const memory = new Map();
  const events = new EventEmitter();

  if (uri) {
    const client = new MongoClient(uri);
    await client.connect();
    collection = client.db(dbName).collection('inventory');
    await collection.createIndex({ key: 1 }, { unique: true });
  }

  const keyOf = (name) => String(name).trim().toLowerCase();
  const clean = ({ _id, ...item }) => item;

  async function list() {
    if (!collection) return [...memory.values()].sort((a, b) => a.name.localeCompare(b.name));
    return (await collection.find({}, { projection: { _id: 0 } }).sort({ name: 1 }).toArray()).map(clean);
  }

  function normalize(input) {
    const name = String(input?.name || '').trim().slice(0, 60);
    if (!name) return null;
    const lbs = input.lbs === '' || input.lbs == null ? null : Number(input.lbs);
    const price = input.price === '' || input.price == null ? null : Number(input.price);
    if ((lbs != null && !(lbs >= 0)) || (price != null && !(price >= 0))) return null;
    return { name, lbs, price };
  }

  async function upsert(item) {
    const key = keyOf(item.name);
    const now = Date.now();
    const set = { name: item.name, updatedAt: now };
    if (item.lbs != null) set.lbs = item.lbs;
    if (item.price != null) set.price = item.price;
    if (!collection) {
      const existing = memory.get(key);
      memory.set(key, { lbs: 0, price: 0, ...existing, ...set, key, createdAt: existing?.createdAt ?? now });
      return { action: existing ? 'updated' : 'added', previousLbs: existing ? existing.lbs : null };
    }
    const before = await collection.findOne({ key }, { projection: { lbs: 1 } });
    await collection.updateOne(
      { key },
      { $set: set, $setOnInsert: { key, createdAt: now, ...(item.lbs == null ? { lbs: 0 } : {}), ...(item.price == null ? { price: 0 } : {}) } },
      { upsert: true },
    );
    return { action: before ? 'updated' : 'added', previousLbs: before ? before.lbs ?? 0 : null };
  }

  async function deliver(payload) {
    if (!webhookUrl) return { delivered: false, reason: 'not-configured' };
    const body = JSON.stringify(payload);
    const headers = { 'Content-Type': 'application/json', 'User-Agent': 'Deckhand-Webhook/1' };
    if (webhookSecret) headers['X-Deckhand-Signature'] = `sha256=${createHmac('sha256', webhookSecret).update(body).digest('hex')}`;
    try {
      const res = await fetchImpl(webhookUrl, { method: 'POST', headers, body, signal: AbortSignal.timeout(5000) });
      if (!res.ok) console.error('Inventory webhook failed', res.status);
      return { delivered: res.ok };
    } catch (err) {
      console.error('Inventory webhook request failed', err.message);
      return { delivered: false, reason: 'network' };
    }
  }

  // Saves the items. `webhook: false` is for quiet syncs, like hand edits to a row.
  async function save(items, { webhook = true, notifyCustomers = false } = {}) {
    const clean = (Array.isArray(items) ? items : []).map(normalize);
    if (!clean.length || clean.some((i) => !i)) return { error: 'invalid' };
    const changes = [];
    for (const item of clean) changes.push({ ...item, ...(await upsert(item)) });
    events.emit('change', changes);
    if (webhook) {
      // Fire and forget: a slow or broken receiver never holds up the seller.
      deliver({ event: 'inventory.updated', at: new Date().toISOString(), notifyCustomers: !!notifyCustomers, items: changes });
    }
    return { items: changes };
  }

  async function remove(name) {
    const key = keyOf(name);
    const removed = collection ? (await collection.deleteOne({ key })).deletedCount > 0 : memory.delete(key);
    if (removed) events.emit('change', []);
    return removed;
  }

  return { list, save, remove, events, mode: collection ? 'mongodb' : 'memory', webhookConfigured: !!webhookUrl };
}
