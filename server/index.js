import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';

import { buildKit } from './kit.js';
import { carriers, ports, sample, speciesSuggestions, statuses } from './ports.js';
import { createStore } from './store.js';

const store = createStore();
const demo = store.seed();

const app = express();
app.use(express.json({ limit: '20kb' }));

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
