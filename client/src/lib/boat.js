import { reactive, watch } from 'vue';

// Shared boat connection. Sample data only; nothing leaves the browser.
export const PORTS = [
  { name: 'Kodiak', lat: 57.79, lon: -152.41 },
  { name: 'Homer', lat: 59.64, lon: -151.55 },
  { name: 'Seward', lat: 60.1, lon: -149.44 },
  { name: 'Cordova', lat: 60.54, lon: -145.76 },
  { name: 'Sitka', lat: 57.05, lon: -135.33 },
  { name: 'Petersburg', lat: 56.81, lon: -132.96 },
  { name: 'Dutch Harbor', lat: 53.89, lon: -166.54 },
  { name: 'Bristol Bay (Naknek)', lat: 58.73, lon: -157.01 },
];

export const VESSEL_TYPES = ['Gillnetter', 'Seiner', 'Troller', 'Longliner', 'Pot boat', 'Other'];

export const METHODS = [
  { key: 'ais', label: 'AIS transponder', field: 'MMSI number', hint: '9 digits, printed on your radio license' },
  { key: 'sat', label: 'Satellite tracker', field: 'Share link or IMEI', hint: 'Garmin inReach, SPOT or Iridium share link, or a 15 digit IMEI' },
  { key: 'phone', label: 'Phone app', field: 'Phone number', hint: 'Location is shared while the app is open' },
];

const KEY = 'deckhand-boat';
const blank = () => ({
  connected: false, name: '', type: '', registration: '', port: 'Kodiak',
  method: 'ais', id: '', precision: 'approx', consent: false,
});

let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch { /* ignore */ }
export const boat = reactive({ ...blank(), ...saved });
watch(boat, () => localStorage.setItem(KEY, JSON.stringify(boat)), { deep: true });

export const homePort = () => PORTS.find((p) => p.name === boat.port) || PORTS[0];

export const boatError = () => {
  if (!boat.name.trim()) return 'Add your boat name.';
  if (!boat.type) return 'Choose a vessel type.';
  if (!boat.registration.trim()) return 'Add your vessel registration number.';
  const id = boat.id.trim();
  if (boat.method === 'ais' && !/^\d{9}$/.test(id)) return 'An MMSI is 9 digits.';
  if (boat.method === 'sat' && !/^(\d{15}|https?:\/\/\S+)$/.test(id)) return 'Add a share link or a 15 digit IMEI.';
  if (boat.method === 'phone' && id.replace(/\D/g, '').length !== 10) return 'Enter a 10 digit phone number.';
  if (!boat.consent) return 'Please confirm you agree to share your location.';
  return '';
};

export const resetBoat = () => Object.assign(boat, blank());

// Simple sample state: out fishing when not at the dock.
export const sampleStatus = () => ({
  out: true,
  place: 'Chiniak Bay, 12 mi from ' + boat.port,
  weather: { temp: 48, wind: 12, sea: '2 to 3 ft', sky: 'Light rain' },
});
