import './env.js';
import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { buildKit } from './kit.js';
import { createInventoryStore } from './inventory.js';
import { createSubscribersStore } from './subscribers.js';
import { createOrdersStore } from './orders.js';
import { forgetSellerPhone, getSellerPhone, recentSms, sendSms, setSellerPhone, showDemoSms, smsEvents } from './sms.js';
import { carriers, ports, sample, speciesSuggestions, statuses } from './ports.js';
import { createStore } from './store.js';

const store = createStore();
const demo = store.seed();
const shopOrders = await createOrdersStore();
const inventory = await createInventoryStore();
const subscribers = await createSubscribersStore();

const app = express();
app.use(express.json({ limit: '20kb' }));

// Customers sign up on the storefront for a text when new fish is listed.
app.post('/api/subscribers', async (req, res) => {
  const { phone, created, error } = await subscribers.add(req.body?.phone);
  if (error) return res.status(400).json({ error });
  res.status(created ? 201 : 200).json({ ok: true });
  if (created) sendSms(phone, "Off the Hook: you're on the list. We'll text you when new fish comes in. Reply STOP to opt out.");
});

// The seller's inventory. A confirmed addition also fires the INVENTORY_WEBHOOK_URL webhook, if one is set.
// Texts sent so far, then a live stream of new ones, for the demo phone.
app.get('/api/sms/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
  res.flushHeaders();
  recentSms().forEach((m) => res.write(`data: ${JSON.stringify(m)}\n\n`));
  const onSms = (m) => res.write(`data: ${JSON.stringify(m)}\n\n`);
  const beat = setInterval(() => res.write(': ping\n\n'), 25000);
  smsEvents.on('sms', onSms);
  req.on('close', () => {
    clearInterval(beat);
    smsEvents.off('sms', onSms);
  });
});
app.get('/api/inventory', async (req, res) => res.json(await inventory.list()));
// Live stream for open storefronts: a message each time inventory changes, so they refetch at once.
app.get('/api/inventory/stream', (req, res) => {
  res.set({ 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' });
  res.flushHeaders();
  res.write(': connected\n\n');
  const onChange = () => res.write('event: inventory\ndata: {}\n\n');
  const beat = setInterval(() => res.write(': ping\n\n'), 25000);
  inventory.events.on('change', onChange);
  req.on('close', () => {
    clearInterval(beat);
    inventory.events.off('change', onChange);
  });
});
app.post('/api/inventory', async (req, res) => {
  const { items, error } = await inventory.save(req.body?.items, {
    webhook: req.body?.webhook !== false,
    notifyCustomers: req.body?.notifyCustomers,
  });
  if (error) return res.status(400).json({ error });
  res.status(201).json(items);
  if (req.body?.notifyCustomers) {
    const names = items.filter((i) => Number(i.lbs) > 0).map((i) => i.name).join(', ') || items.map((i) => i.name).join(', ');
    const base = (process.env.PUBLIC_URL || req.get('origin') || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
    const text = `Off the Hook: fresh catch just in, ${names}. Tap to order direct: ${base}/example Reply STOP to opt out.`;
    subscribers.list().then((phones) => {
      phones.forEach((p) => sendSms(p, text));
      // With nobody signed up yet, still show the text on the demo phone.
      if (!phones.length) showDemoSms('5550100100', text);
    });
  }
});
app.delete('/api/inventory/:name', async (req, res) => {
  if (!(await inventory.remove(req.params.name))) return res.status(404).json({ error: 'not-found' });
  res.status(204).end();
});

// Orders from the Off the Hook sample store, shown on the dashboard's My orders page.
app.get('/api/shop-orders', async (req, res) => res.json(await shopOrders.list()));
app.post('/api/shop-orders', async (req, res) => {
  const { order, error } = await shopOrders.create(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json(order);
  const base = (process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
  sendSms(getSellerPhone(), `Deckhand: new order ${order.id} from ${order.name}. ${order.lbs} lb ${order.item}, $${Number(order.total || 0).toFixed(2)}. Print shipping label: ${base}/label/${encodeURIComponent(order.id)} Reply STOP to opt out.`);
});
// Where order texts go. The open dashboard sends its number, and re-sends it every minute.
app.put('/api/seller-phone', (req, res) => {
  const digits = String(req.body?.phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (digits.length !== 10) return res.status(400).json({ error: 'invalid' });
  setSellerPhone(digits);
  res.status(204).end();
  // Only the Save button asks for a confirmation; the once-a-minute re-send does not.
  if (req.body?.confirm) sendSms(digits, "Deckhand: you're set. We'll message you here each time an order comes in while Deckhand is open in your browser. Reply STOP to opt out.");
});
// Sent when the number is removed or the browser closes.
app.delete('/api/seller-phone', (req, res) => {
  forgetSellerPhone();
  res.status(204).end();
});
// Printable shipping label, linked from the order text.
app.get('/label/:id', async (req, res) => {
  const o = (await shopOrders.list()).find((x) => x.id.toLowerCase() === req.params.id.toLowerCase());
  if (!o) return res.status(404).send('Order not found');
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  res.type('html').send(`<!doctype html><title>Label ${esc(o.id)}</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px}.l{border:3px solid #000;padding:20px;width:4in}h1{margin:0 0 4px;font-size:14px;letter-spacing:.1em}.to{font-size:22px;font-weight:700;margin:18px 0 4px}.m{font-size:14px;margin:2px 0}.f{border-top:2px dashed #000;margin-top:16px;padding-top:10px;font-size:13px}@media print{button{display:none}}</style><div class="l"><h1>PERISHABLE - KEEP FROZEN</h1><p class="m">From: Off the Hook, Kodiak, AK</p><p class="to">${esc(o.name)}</p><p class="m">${esc(o.email)}</p><p class="m">[Street address, city, state ZIP]</p><div class="f">Order ${esc(o.id)}<br>${esc(o.lbs)} lb ${esc(o.item)}</div></div><p><button onclick="print()">Print label</button></p>`);
});
app.patch('/api/shop-orders/:id', async (req, res) => {
  const { order, error } = await shopOrders.setStatus(req.params.id, req.body?.status);
  if (error === 'not-found') return res.status(404).json({ error });
  if (error) return res.status(400).json({ error });
  res.json(order);
});
app.delete('/api/shop-orders/:id', async (req, res) => {
  if (!(await shopOrders.remove(req.params.id))) return res.status(404).json({ error: 'not-found' });
  res.status(204).end();
});

const siteUrl = (req, slug) => `${req.protocol}://${req.get('host')}/s/${slug}`;

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

// Everything the builder form needs to draw itself.
app.get('/api/options', (req, res) => {
  res.json({
    ports,
    statuses,
    species: speciesSuggestions,
    carriers: carriers.map(({ id, name }) => ({ id, name })),
    sample,
    demo,
  });
});

// Live preview for the builder: catch details in, wording out. Stores nothing.
app.post('/api/kit', (req, res) => {
  res.json(buildKit(req.body));
});

// The collective creates (or updates) its site.
app.post('/api/sites', (req, res) => {
  const site = store.saveSite(req.body);
  res.status(201).json(store.getSite(site.slug, { url: siteUrl(req, site.slug) }));
});

// What a buyer sees.
app.get('/api/sites/:slug', (req, res) => {
  const site = store.getSite(req.params.slug, { url: siteUrl(req, req.params.slug) });
  if (!site) return res.status(404).json({ error: 'not-found' });
  res.json(site);
});

// "Buy". Records the order only: the prototype takes no payment.
app.post('/api/sites/:slug/orders', (req, res) => {
  const { order, error } = store.placeOrder(req.params.slug, req.body);
  if (error === 'not-found') return res.status(404).json({ error });
  if (error === 'sold-out') return res.status(409).json({ error });
  if (error) return res.status(400).json({ error });
  res.status(201).json(order);
});

// The buyer's tracking page.
app.get('/api/orders/:id', (req, res) => {
  const order = store.getOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'not-found' });
  res.json(order);
});

// Demo controls. In a real product only the fisherman could do these.
app.post('/api/orders/:id/advance', (req, res) => {
  const order = store.advanceOrder(req.params.id, req.body);
  if (!order) return res.status(404).json({ error: 'not-found' });
  res.json(order);
});

app.post('/api/orders/:id/reset', (req, res) => {
  const order = store.resetOrder(req.params.id);
  if (!order) return res.status(404).json({ error: 'not-found' });
  res.json(order);
});

// After `npm run build`, serve the Vue app from the same server.
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'client', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(dist, 'index.html'));
  });
}

const port = Number(process.env.PORT) || 3001;
app.listen(port, () => {
  console.log(`Deckhand API on http://localhost:${port}`);
});
