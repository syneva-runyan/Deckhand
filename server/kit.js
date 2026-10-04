// Turns a few facts about a catch into a "kit": the headline and lines for the
// collective's site, a ready-to-paste post announcing it, and what the catch
// is worth sold direct compared with the dock price.
//
// It is plain templates on purpose. Nothing here calls an outside service, so
// the same input always gives the same words and the demo works offline.

import { ports, sample } from './ports.js';

const HEADLINES = {
  ahead: 'FISH AHEAD',
  landing: 'LANDING DAY',
  soldout: 'SOLD OUT',
};

export function text(value, max, fallback) {
  const cleaned = String(value ?? '').replace(/\s+/g, ' ').trim().slice(0, max);
  return cleaned || fallback;
}

export function number(value, max, fallback) {
  const n = Number(value);
  if (value === null || value === undefined || value === '') return fallback;
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(max, n);
}

const cents = (n) => Math.round(n * 100) / 100;

export function money(n) {
  return (
    '$' +
    n.toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(n) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}

export const pounds = (n) => `${n.toLocaleString('en-US', { maximumFractionDigits: 1 })} lb`;

// The catch details a site is built from, cleaned up and with gaps filled.
export function cleanCatch(input = {}) {
  const port = ports.find((p) => p.id === input.port) ?? ports[0];
  return {
    collective: text(input.collective, 60, sample.collective),
    port: port.id,
    boat: text(input.boat, 40, sample.boat),
    species: text(input.species, 40, sample.species),
    grounds: text(input.grounds, 40, 'local waters'),
    pounds: number(input.pounds, 100000, sample.pounds),
    directPrice: number(input.directPrice, 1000, sample.directPrice),
    dockPrice: number(input.dockPrice, 1000, sample.dockPrice),
    when: text(input.when, 40, 'this week'),
    status: HEADLINES[input.status] ? input.status : 'ahead',
  };
}

function worthOf(lb, directPrice, dockPrice) {
  const dockTotal = cents(lb * dockPrice);
  const directTotal = cents(lb * directPrice);
  const extra = cents(directTotal - dockTotal);
  const multiple = dockPrice > 0 ? Math.round((directPrice / dockPrice) * 10) / 10 : null;
  const message =
    extra > 0
      ? `Same fish, same work. Selling ${pounds(lb)} direct brings in ${money(extra)} more than the dock price.`
      : 'At these prices the dock pays the same or more. Check the direct price.';
  return { pounds: lb, directPrice, dockPrice, dockTotal, directTotal, extra, multiple, message };
}

// `url` is the address of the collective's site, used in the post.
export function buildKit(input = {}, { url } = {}) {
  const c = cleanCatch(input);
  const port = ports.find((p) => p.id === c.port);
  const slogan = port.slogan.map((part) => part.text).join(' ');
  const price = `${money(c.directPrice)}/lb`;
  const order = url ? `Order here: ${url}` : 'Order on our site.';

  const sign = {
    headline: HEADLINES[c.status],
    species: c.species,
    boat: c.boat,
    collective: c.collective,
    port: port.name,
    price,
    slogan: port.slogan,
    lines: [],
  };

  let post;
  if (c.status === 'ahead') {
    sign.lines = [`About ${pounds(c.pounds)} at ${price}`, `Landing ${c.when}`];
    post = [
      `FISH AHEAD. ${c.boat} is heading out to ${c.grounds} for ${c.species}.`,
      `About ${pounds(c.pounds)} at ${price}, landing ${c.when}.`,
      `Claim yours before it leaves the water, then follow it all the way to your door.`,
      order,
      `From your neighbors at ${c.collective}.`,
      slogan,
    ].join('\n');
  } else if (c.status === 'landing') {
    sign.lines = [`${pounds(c.pounds)} left at ${price}`, `Landed ${c.when}`];
    post = [
      `LANDING DAY. Fresh ${c.species} off ${c.boat}, caught in ${c.grounds}.`,
      `${pounds(c.pounds)} left at ${price}.`,
      order,
      `Straight from the boat, from ${c.collective}.`,
      slogan,
    ].join('\n');
  } else {
    sign.lines = [`Thank you, ${port.name}`, 'Next trip coming soon'];
    post = [
      `SOLD OUT. Every pound of ${c.species} off ${c.boat} is spoken for.`,
      `Thank you, ${port.name}. Watch this space for the next trip.`,
      `${c.collective}.`,
      slogan,
    ].join('\n');
  }

  return {
    status: c.status,
    port: { id: port.id, name: port.name, checkedByLocal: port.checkedByLocal },
    sign,
    post,
    worth: worthOf(c.pounds, c.directPrice, c.dockPrice),
  };
}
