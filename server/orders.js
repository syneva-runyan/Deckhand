import { randomUUID } from 'node:crypto';

import { MongoClient } from 'mongodb';

export const ORDER_STATUSES = ['new', 'packing', 'shipped', 'delivered'];

// Orders live in the `orders` collection when MONGODB_URI is set. Without it they
// sit in memory, so local development works with no database installed.
export async function createOrdersStore({ uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB || 'deckhand' } = {}) {
  let collection = null;
  const memory = [];

  if (uri) {
    const client = new MongoClient(uri);
    await client.connect();
    collection = client.db(dbName).collection('orders');
    await collection.createIndex({ createdAt: -1 });
  }

  const clean = ({ _id, ...order }) => order;

  async function list() {
    if (!collection) return [...memory].sort((a, b) => b.createdAt - a.createdAt);
    return (await collection.find({}, { projection: { _id: 0 } }).sort({ createdAt: -1 }).toArray()).map(clean);
  }

  async function create(input = {}) {
    const name = String(input.name || '').trim();
    const email = String(input.email || '').trim();
    const lbs = Number(input.lbs);
    const item = String(input.item || '').trim();
    if (!name || !/\S+@\S+\.\S+/.test(email) || !item || !(lbs > 0)) return { error: 'invalid' };
    const order = {
      id: String(input.id || `DH-${Math.floor(1000 + Math.random() * 9000)}`),
      uid: randomUUID(),
      name,
      email,
      item,
      lbs,
      total: Number(input.total) || 0,
      status: 'new',
      createdAt: Date.now(),
    };
    if (collection) await collection.insertOne({ ...order });
    else memory.push(order);
    return { order };
  }

  async function setStatus(id, status) {
    if (!ORDER_STATUSES.includes(status)) return { error: 'invalid' };
    if (!collection) {
      const order = memory.find((o) => o.id === id);
      if (!order) return { error: 'not-found' };
      order.status = status;
      return { order };
    }
    const found = await collection.findOneAndUpdate({ id }, { $set: { status } }, { returnDocument: 'after', projection: { _id: 0 } });
    return found ? { order: clean(found) } : { error: 'not-found' };
  }

  async function remove(id) {
    if (!collection) {
      const i = memory.findIndex((o) => o.id === id);
      if (i < 0) return false;
      memory.splice(i, 1);
      return true;
    }
    return (await collection.deleteOne({ id })).deletedCount > 0;
  }

  return { list, create, setStatus, remove, mode: collection ? 'mongodb' : 'memory' };
}
