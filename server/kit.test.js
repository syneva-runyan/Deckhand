import { test } from 'node:test';
import assert from 'node:assert/strict';

import { buildKit, money } from './kit.js';
import { ports, sample } from './ports.js';

test('a pre-order kit uses the catch details and the port slogan', () => {
  const kit = buildKit({ ...sample, port: 'juneau', status: 'ahead' }, { url: 'http://x/s/y' });

  assert.equal(kit.sign.headline, 'FISH AHEAD');
  assert.equal(kit.sign.port, 'Juneau');
  assert.deepEqual(kit.sign.lines, ['About 200 lb at $12/lb', 'Landing Saturday']);
  assert.match(kit.post, /F\/V Sample is heading out to Taku Inlet for Coho salmon/);
  assert.match(kit.post, /Order here: http:\/\/x\/s\/y/);
  assert.match(kit.post, /SOLD OUT THE ROAD AND BEYOND$/);
});

test('landing day and sold out have their own wording', () => {
  const landing = buildKit({ ...sample, status: 'landing' });
  assert.equal(landing.sign.headline, 'LANDING DAY');
  assert.match(landing.post, /200 lb left at \$12\/lb/);
  assert.match(landing.post, /Order on our site\./);

  const soldOut = buildKit({ ...sample, port: 'kodiak', status: 'soldout' });
  assert.equal(soldOut.sign.headline, 'SOLD OUT');
  assert.match(soldOut.post, /Thank you, Kodiak\./);
  assert.match(soldOut.post, /OFF THE ROCK WITHOUT LEAVING IT$/);
});

test('worth compares the dock price with the direct price', () => {
  const { worth } = buildKit({ pounds: 200, directPrice: 12, dockPrice: 2 });

  assert.equal(worth.dockTotal, 400);
  assert.equal(worth.directTotal, 2400);
  assert.equal(worth.extra, 2000);
  assert.equal(worth.multiple, 6);
  assert.match(worth.message, /\$2,000 more than the dock price/);
});

test('worth does not claim a gain when direct is not higher', () => {
  const { worth } = buildKit({ pounds: 100, directPrice: 2, dockPrice: 3 });

  assert.equal(worth.extra, -100);
  assert.match(worth.message, /Check the direct price/);
});

test('a dock price of zero gives no multiple instead of dividing by zero', () => {
  const { worth } = buildKit({ pounds: 10, directPrice: 5, dockPrice: 0 });

  assert.equal(worth.multiple, null);
  assert.equal(worth.extra, 50);
});

test('bad or missing input falls back to safe defaults', () => {
  const kit = buildKit({
    port: 'atlantis',
    status: 'nonsense',
    pounds: 'lots',
    directPrice: -4,
    dockPrice: '',
    boat: '   ',
    species: 'x'.repeat(500),
  });

  assert.equal(kit.port.id, ports[0].id);
  assert.equal(kit.status, 'ahead');
  assert.equal(kit.worth.pounds, sample.pounds);
  assert.equal(kit.worth.directPrice, sample.directPrice);
  assert.equal(kit.worth.dockPrice, sample.dockPrice);
  assert.equal(kit.sign.boat, sample.boat);
  assert.equal(kit.sign.species.length, 40);
  assert.doesNotThrow(() => buildKit());
});

test('money keeps whole dollars short and shows cents otherwise', () => {
  assert.equal(money(12), '$12');
  assert.equal(money(2400), '$2,400');
  assert.equal(money(3.5), '$3.50');
});

test('every port has a slogan with one highlighted part', () => {
  for (const port of ports) {
    assert.ok(port.slogan.length >= 2, port.id);
    assert.equal(port.slogan.filter((part) => part.accent).length, 1, port.id);
  }
});
