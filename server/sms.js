// Sends texts through Twilio's REST API. Without credentials it logs the message instead.

// The number saved on the dashboard is held in memory only, and only while that browser stays open:
// the open page re-sends it every minute, and it is dropped when the page closes or the pings stop.
// NOTIFY_PHONE is the operator's own fallback, used when no dashboard is open.
const SESSION_MS = 5 * 60 * 1000;
let sellerPhone = '';
let seenAt = 0;

export const setSellerPhone = (digits) => { sellerPhone = digits; seenAt = Date.now(); };
export const forgetSellerPhone = () => { sellerPhone = ''; };
export const getSellerPhone = () => {
  if (sellerPhone && Date.now() - seenAt > SESSION_MS) sellerPhone = '';
  return sellerPhone || process.env.NOTIFY_PHONE || '';
};

const toE164 = (p) => {
  const d = String(p || '').replace(/\D/g, '').replace(/^1(?=\d{10}$)/, '');
  return d.length === 10 ? `+1${d}` : '';
};

export async function sendSms(to, body) {
  const num = toE164(to);
  if (!num) return { sent: false, reason: 'no-phone' };
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: from } = process.env;
  if (!sid || !token || !from) {
    console.log(`[sms disabled] to number ending ${num.slice(-2)}: ${body}`);
    return { sent: false, reason: 'not-configured' };
  }
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ To: num, From: from, Body: body }),
    });
    if (!res.ok) console.error('Twilio error', res.status, await res.text());
    return { sent: res.ok };
  } catch (err) {
    console.error('Twilio request failed', err.message);
    return { sent: false, reason: 'network' };
  }
}
