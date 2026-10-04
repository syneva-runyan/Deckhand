import { MongoClient } from 'mongodb';

// Customers who asked for a text when new fish is listed. Kept in the `subscribers` collection when
// MONGODB_URI is set, and in memory otherwise.
export async function createSubscribersStore({ uri = process.env.MONGODB_URI, dbName = process.env.MONGODB_DB || 'deckhand' } = {}) {
  let collection = null;
  const memory = new Map();

  if (uri) {
    const client = new MongoClient(uri);
    await client.connect();
    collection = client.db(dbName).collection('subscribers');
    await collection.createIndex({ phone: 1 }, { unique: true });
  }

  const digitsOf = (p) => String(p || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');

  async function add(input) {
    const phone = digitsOf(input);
    if (phone.length !== 10) return { error: 'invalid' };
    if (!collection) {
      const existing = memory.has(phone);
      if (!existing) memory.set(phone, { phone, createdAt: Date.now() });
      return { phone, created: !existing };
    }
    const result = await collection.updateOne({ phone }, { $setOnInsert: { phone, createdAt: Date.now() } }, { upsert: true });
    return { phone, created: result.upsertedCount > 0 };
  }

  async function list() {
    if (!collection) return [...memory.keys()];
    return (await collection.find({}, { projection: { _id: 0, phone: 1 } }).toArray()).map((s) => s.phone);
  }

  async function remove(input) {
    const phone = digitsOf(input);
    if (!collection) return memory.delete(phone);
    return (await collection.deleteOne({ phone })).deletedCount > 0;
  }

  return { add, list, remove, mode: collection ? 'mongodb' : 'memory' };
}
