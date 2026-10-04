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

// Every text is also kept here so a demo can show them on an on-screen phone.
// With DEMO_SMS=1 nothing goes out through Twilio.
import { EventEmitter } from 'node:events';
export const smsEvents = new EventEmitter();
const smsLog = [];
export const recentSms = () => smsLog.slice();
function record(num, body) {
  const msg = { id: `${Date.now()}-${smsLog.length}`, to: `(${num.slice(2, 5)}) ${num.slice(5, 8)}-${num.slice(8)}`, body, at: new Date().toISOString() };
  smsLog.push(msg);
  if (smsLog.length > 50) smsLog.shift();
  smsEvents.emit('sms', msg);
}

export async function sendSms(to, body) {
  const num = toE164(to);
  if (!num) return { sent: false, reason: 'no-phone' };
  record(num, body);
  if (/^(1|true)$/i.test(process.env.DEMO_SMS || '')) return { sent: false, reason: 'demo' };
  const { TWILIO_ACCOUNT_SID: sid, TWILIO_AUTH_TOKEN: token, TWILIO_FROM: smsFrom, TWILIO_WHATSAPP_FROM: waFrom } = process.env;
  // With TWILIO_WHATSAPP_FROM set (Twilio's WhatsApp sandbox is +14155238886), the alert goes over WhatsApp instead of SMS.
  const whatsapp = waFrom ? `whatsapp:${waFrom.replace(/^whatsapp:/, '').trim()}` : '';
  const from = whatsapp || smsFrom;
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
      body: new URLSearchParams({ To: whatsapp ? `whatsapp:${num}` : num, From: from, Body: body }),
    });
    if (!res.ok) console.error('Twilio error', res.status, await res.text());
    return { sent: res.ok };
  } catch (err) {
    console.error('Twilio request failed', err.message);
    return { sent: false, reason: 'network' };
  }
}
