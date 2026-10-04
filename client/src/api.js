// Small wrapper around fetch for the Express API.

async function request(path, options) {
  const res = await fetch(path, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const error = new Error(data.error || `Request failed (${res.status})`);
    error.status = res.status;
    error.code = data.error;
    throw error;
  }
  return data;
}

const post = (path, body = {}) =>
  request(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

export const api = {
  options: () => request('/api/options'),
  kit: (details) => post('/api/kit', details),
  saveSite: (details) => post('/api/sites', details),
  site: (slug) => request(`/api/sites/${slug}`),
  buy: (slug, order) => post(`/api/sites/${slug}/orders`, order),
  order: (id) => request(`/api/orders/${id}`),
  advance: (id, tracking) => post(`/api/orders/${id}/advance`, tracking),
  reset: (id) => post(`/api/orders/${id}/reset`),
};

export function money(n) {
  return (
    '$' +
    Number(n).toLocaleString('en-US', {
      minimumFractionDigits: Number.isInteger(Number(n)) ? 0 : 2,
      maximumFractionDigits: 2,
    })
  );
}
