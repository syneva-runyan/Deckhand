import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { buildKit } from './kit.js';
import { createOrdersStore } from './orders.js';
import { getSellerPhone, sendSms, setSellerPhone } from './sms.js';
import { carriers, ports, sample, speciesSuggestions, statuses } from './ports.js';
import { createStore } from './store.js';

const store = createStore();
const demo = store.seed();
const shopOrders = await createOrdersStore();

const app = express();
app.use(express.json({ limit: '20kb' }));

// Orders from the Off the Rock sample store, shown on the dashboard's My orders page.
app.get('/api/shop-orders', async (req, res) => res.json(await shopOrders.list()));
app.post('/api/shop-orders', async (req, res) => {
  const { order, error } = await shopOrders.create(req.body);
  if (error) return res.status(400).json({ error });
  res.status(201).json(order);
  const base = process.env.PUBLIC_URL || `${req.protocol}://${req.get('host')}`;
  sendSms(getSellerPhone(), `Deckhand: new order ${order.id} from ${order.name}. ${order.lbs} lb ${order.item}, $${Number(order.total || 0).toFixed(2)}. Print shipping label: ${base}/label/${encodeURIComponent(order.id)}`);
});
// Where order texts go. The dashboard sends the number it saved.
app.put('/api/seller-phone', (req, res) => {
  const digits = String(req.body?.phone || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  if (digits.length !== 10) return res.status(400).json({ error: 'invalid' });
  setSellerPhone(digits);
  res.status(204).end();
});
// Printable shipping label, linked from the order text.
app.get('/label/:id', async (req, res) => {
  const o = (await shopOrders.list()).find((x) => x.id.toLowerCase() === req.params.id.toLowerCase());
  if (!o) return res.status(404).send('Order not found');
  const esc = (s) => String(s).replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[ch]);
  res.type('html').send(`<!doctype html><title>Label ${esc(o.id)}</title><style>body{font-family:system-ui,sans-serif;margin:0;padding:24px}.l{border:3px solid #000;padding:20px;width:4in}h1{margin:0 0 4px;font-size:14px;letter-spacing:.1em}.to{font-size:22px;font-weight:700;margin:18px 0 4px}.m{font-size:14px;margin:2px 0}.f{border-top:2px dashed #000;margin-top:16px;padding-top:10px;font-size:13px}@media print{button{display:none}}</style><div class="l"><h1>PERISHABLE - KEEP FROZEN</h1><p class="m">From: Off the Rock, Kodiak, AK</p><p class="to">${esc(o.name)}</p><p class="m">${esc(o.email)}</p><p class="m">[Street address, city, state ZIP]</p><div class="f">Order ${esc(o.id)}<br>${esc(o.lbs)} lb ${esc(o.item)}</div></div><p><button onclick="print()">Print label</button></p>`);
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
