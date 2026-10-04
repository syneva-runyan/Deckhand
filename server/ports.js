// Home ports and their local lines.
//
// Each slogan is split into parts so the page can pick one part out in gold.
// Every line here is a DRAFT written by the team, not by people from that
// town. `checkedByLocal` stays false until someone who fishes there says the
// line lands. Add a port by adding an entry.

export const ports = [
  {
    id: 'juneau',
    name: 'Juneau',
    slogan: [{ text: 'SOLD OUT', accent: true }, { text: 'THE ROAD AND BEYOND' }],
    checkedByLocal: false,
  },
  {
    id: 'kodiak',
    name: 'Kodiak',
    slogan: [{ text: 'OFF THE ROCK', accent: true }, { text: 'WITHOUT LEAVING IT' }],
    checkedByLocal: false,
  },
  {
    id: 'kotzebue',
    name: 'Kotzebue',
    slogan: [{ text: 'NO ROAD', accent: true }, { text: 'NEEDED' }],
    checkedByLocal: false,
  },
  {
    id: 'cordova',
    name: 'Cordova',
    slogan: [{ text: 'NO ROAD.', accent: true }, { text: 'NO PROBLEM.' }],
    checkedByLocal: false,
  },
  {
    id: 'homer',
    name: 'Homer',
    slogan: [{ text: 'END OF THE ROAD,', accent: true }, { text: 'START OF THE LINE' }],
    checkedByLocal: false,
  },
  {
    id: 'sitka',
    name: 'Sitka',
    slogan: [{ text: 'RUNS IN' }, { text: 'SITKA SNEAKERS', accent: true }],
    checkedByLocal: false,
  },
  {
    id: 'petersburg',
    name: 'Petersburg',
    slogan: [{ text: 'UFF DA,', accent: true }, { text: "THAT'S FRESH" }],
    checkedByLocal: false,
  },
  {
    id: 'ketchikan',
    name: 'Ketchikan',
    slogan: [{ text: 'RAIN', accent: true }, { text: 'OR RAIN' }],
    checkedByLocal: false,
  },
];

// Where the catch is in the season. This decides the headline on the site.
export const statuses = [
  { id: 'ahead', label: 'Fish ahead', hint: 'Taking pre-orders' },
  { id: 'landing', label: 'Landing day', hint: 'Catch is in' },
  { id: 'soldout', label: 'Sold out', hint: 'Orders full' },
];

export const speciesSuggestions = [
  'King salmon',
  'Coho salmon',
  'Sockeye salmon',
  'Keta salmon',
  'Halibut',
  'Black cod',
  'Rockfish',
  'Spot prawns',
  'Dungeness crab',
];

// Carriers a collective can pick when an order ships. `track` builds the link
// to that carrier's own tracking page; carriers without a per-package link
// just point at their tracking site.
export const carriers = [
  { id: 'alaska-air-cargo', name: 'Alaska Air Cargo', track: () => 'https://www.alaskacargo.com/' },
  { id: 'ups', name: 'UPS', track: (n) => `https://www.ups.com/track?tracknum=${encodeURIComponent(n)}` },
  { id: 'fedex', name: 'FedEx', track: (n) => `https://www.fedex.com/fedextrack/?trknbr=${encodeURIComponent(n)}` },
  { id: 'usps', name: 'USPS', track: (n) => `https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(n)}` },
];

// What the builder form starts with. These are placeholders for the demo, not
// market data and not a real boat or collective.
export const sample = {
  collective: 'Sample Harbor Collective',
  port: 'juneau',
  boat: 'F/V Sample',
  species: 'Coho salmon',
  grounds: 'Taku Inlet',
  pounds: 200,
  directPrice: 12,
  dockPrice: 2,
  when: 'Saturday',
  status: 'ahead',
};
