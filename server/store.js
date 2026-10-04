// Sites and orders, kept in memory.
//
// This is the whole "database" for the prototype: restart the server and
// everything except the seeded demo site and order is gone. There are no
// accounts and no payments. An order stores a first name and a weight only.

import { randomBytes } from 'node:crypto';

import { buildKit, cleanCatch, number, pounds, text } from './kit.js';
import { carriers, ports, sample } from './ports.js';

// The journey a buyer follows, in order.
export const STAGES = [
  { id: 'swimming', label: 'Still swimming' },
  { id: 'caught', label: 'Caught' },
  { id: 'processing', label: 'Off to processing' },
  { id: 'packing', label: 'Getting packed' },
  { id: 'shipped', label: 'Shipped' },
];

function stageMessage(stage, order, site) {
  const { species, boat, grounds } = site.catch;
  const portName = ports.find((p) => p.id === site.catch.port).name;
  switch (stage) {
    case 'swimming':
      return `Your ${species} is still out in ${grounds}, and ${boat} is on the way to meet it.`;
    case 'caught':
      return `${boat} landed your ${species} in ${grounds}. It's on ice and headed for ${portName}.`;
    case 'processing':
      return `Your ${species} is being cleaned, cut and chilled a short trip from the dock.`;
    case 'packing':
      return `${pounds(order.pounds)} of ${species}, boxed on ice with your name on it.`;
    default:
      return `It's on its way to you from ${portName}.`;
  }
}

export function createStore() {
  const sites = new Map();
  const orders = new Map();

  function slugFor(name) {
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40);
    return slug || 'collective';
  }

  // Creating a site with a name that already exists updates that site. There
  // are no logins in the prototype, so a name is all that identifies it.
  function saveSite(input) {
    const details = cleanCatch(input);
    const slug = slugFor(details.collective);
    const existing = sites.get(slug);
    const site = { slug, catch: details, remaining: details.pounds, orderIds: existing?.orderIds ?? [] };
    if (site.remaining === 0) site.catch.status = 'soldout';
    sites.set(slug, site);
    return viewSite(site);
  }

  function viewSite(site, { url } = {}) {
    const kit = buildKit({ ...site.catch, pounds: site.remaining }, { url });
    return {
      slug: site.slug,
      collective: site.catch.collective,
      boat: site.catch.boat,
      species: site.catch.species,
      grounds: site.catch.grounds,
      directPrice: site.catch.directPrice,
      remaining: site.remaining,
      status: site.catch.status,
      port: kit.port,
      sign: kit.sign,
      post: kit.post,
      orders: site.orderIds.length,
    };
  }

  function getSite(slug, options) {
    const site = sites.get(slug);
    return site ? viewSite(site, options) : null;
  }

  function viewOrder(order) {
    const site = sites.get(order.slug);
    const stage = STAGES[order.stage];
    const view = {
      id: order.id,
      name: order.name,
      pounds: order.pounds,
      total: Math.round(order.pounds * site.catch.directPrice * 100) / 100,
      stage: stage.id,
      stageIndex: order.stage,
      stages: STAGES,
      message: stageMessage(stage.id, order, site),
      site: {
        slug: site.slug,
        collective: site.catch.collective,
        boat: site.catch.boat,
        species: site.catch.species,
        port: ports.find((p) => p.id === site.catch.port).name,
        slogan: ports.find((p) => p.id === site.catch.port).slogan,
      },
      tracking: null,
    };
    if (order.tracking) {
      const carrier = carriers.find((c) => c.id === order.tracking.carrier) ?? carriers[0];
      view.tracking = {
        carrier: carrier.name,
        number: order.tracking.number,
        url: carrier.track(order.tracking.number),
        isSample: order.tracking.isSample,
      };
    }
    return view;
  }

  // Returns { order } or { error } so the route can pick the status code.
  function placeOrder(slug, input = {}) {
    const site = sites.get(slug);
    if (!site) return { error: 'not-found' };
    if (site.remaining <= 0 || site.catch.status === 'soldout') return { error: 'sold-out' };

    const wanted = number(input.pounds, 100000, 0);
    if (wanted <= 0) return { error: 'bad-amount' };
    const lb = Math.min(wanted, site.remaining);

    const order = {
      id: randomBytes(4).toString('hex'),
      slug,
      name: text(input.name, 30, 'Friend'),
      pounds: lb,
      // A pre-order starts with the fish still in the water. If the catch is
      // already landed, the journey starts at "caught".
      stage: site.catch.status === 'ahead' ? 0 : 1,
      tracking: null,
    };
    orders.set(order.id, order);
    site.orderIds.push(order.id);
    site.remaining = Math.round((site.remaining - lb) * 10) / 10;
    if (site.remaining <= 0) site.catch.status = 'soldout';
    return { order: viewOrder(order) };
  }

  function getOrder(id) {
    const order = orders.get(id);
    return order ? viewOrder(order) : null;
  }

  // Moves an order one stage along. Reaching "shipped" needs a tracking
  // number; without one the prototype fills in an obvious placeholder.
  function advanceOrder(id, input = {}) {
    const order = orders.get(id);
    if (!order) return null;
    if (order.stage < STAGES.length - 1) order.stage += 1;
    if (STAGES[order.stage].id === 'shipped' && !order.tracking) {
      const typed = text(input.number, 40, '');
      order.tracking = {
        carrier: carriers.some((c) => c.id === input.carrier) ? input.carrier : carriers[0].id,
        number: typed || 'SAMPLE-0000',
        isSample: !typed,
      };
    }
    return viewOrder(order);
  }

  // Puts an order back at its first stage so the demo can be run again.
  function resetOrder(id) {
    const order = orders.get(id);
    if (!order) return null;
    order.stage = 0;
    order.tracking = null;
    return viewOrder(order);
  }

  // A site and an order with fixed addresses, so the demo links always work.
  function seed() {
    const site = saveSite(sample);
    const order = {
      id: 'demo',
      slug: site.slug,
      name: 'Sam',
      pounds: 10,
      stage: 0,
      tracking: null,
    };
    orders.set(order.id, order);
    const stored = sites.get(site.slug);
    stored.orderIds.push(order.id);
    stored.remaining -= order.pounds;
    return { slug: site.slug, orderId: order.id };
  }

  return { saveSite, getSite, placeOrder, getOrder, advanceOrder, resetOrder, seed };
}
