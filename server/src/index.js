// @ts-check
// Spoke seller API — zero-dependency Node 20+ HTTP server (Cloud Run).
// The buyer's app negotiates the Spoke+ subscription price; every outcome is
// one of the merchant's pre-approved store tiers, mapped to a RevenueCat
// package. The tier list never leaves this server. A tampered client can at
// worst present the floor tier — which the merchant approved by listing it.
// Run: node src/index.js   (TIERS/TIER_PACKAGES/CURRENCY via env)

import http from 'node:http';
import crypto from 'node:crypto';
import { createNegotiation, applyOffer, acceptStanding, publicView } from '../../engine/src/negotiation.js';
import { sellerMessage, fmt } from './seller.js';

const PORT = Number(process.env.PORT) || 8080;
const TIERS = (process.env.TIERS || '3990,3490,2990,2490,1990').split(',').map(Number);
const PACKAGES = (process.env.TIER_PACKAGES || 'spoke_plus_3990,spoke_plus_3490,spoke_plus_2990,spoke_plus_2490,spoke_plus_1990').split(',');
const OFFER_TTL_HOURS = 48;
const SESSION_LIMIT = 1000; // in-memory; min/max-instances=1 in prod, like Haggle

if (PACKAGES.length !== TIERS.length) throw new Error('TIER_PACKAGES must match TIERS');

/** @typedef {import('../../engine/src/negotiation.js').Session} Session */
/** @type {Map<string, Session>} */
const sessions = new Map();

/**
 * @param {http.ServerResponse} res
 * @param {number} status
 * @param {unknown} body
 */
function send(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

/** @param {http.IncomingMessage} req */
async function readJson(req) {
  let raw = '';
  for await (const chunk of req) {
    raw += chunk;
    if (raw.length > 10_000) throw new Error('body too large');
  }
  return raw ? JSON.parse(raw) : {};
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url || '/', 'http://x');
  try {
    if (req.method === 'GET' && url.pathname === '/healthz') {
      return void send(res, 200, { ok: true, tiers: TIERS.length });
    }

    if (req.method === 'POST' && url.pathname === '/api/session') {
      const s = createNegotiation(TIERS);
      const id = crypto.randomBytes(9).toString('base64url');
      if (sessions.size >= SESSION_LIMIT) {
        const oldest = sessions.keys().next().value;
        if (oldest !== undefined) sessions.delete(oldest);
      }
      sessions.set(id, s);
      const message = await sellerMessage('open', { askPrice: TIERS[0] }, 0);
      return void send(res, 200, { sessionId: id, message, ...publicView(s) });
    }

    if (req.method === 'POST' && url.pathname === '/api/offer') {
      const { sessionId, offerMinor } = await readJson(req);
      const s = sessions.get(String(sessionId));
      if (!s) return void send(res, 404, { error: 'unknown session', code: 'UNKNOWN_SESSION' });
      let decision;
      try {
        decision = applyOffer(s, offerMinor);
      } catch {
        return void send(res, 400, { error: 'invalid offer' });
      }
      const message = await sellerMessage(
        decision.kind,
        { offer: Math.round(Number(offerMinor)), askPrice: decision.askPrice, dealPrice: decision.dealPrice },
        s.rounds
      );
      return void send(res, 200, { decision: decision.kind, message, ...publicView(s) });
    }

    if (req.method === 'POST' && url.pathname === '/api/accept') {
      const { sessionId } = await readJson(req);
      const s = sessions.get(String(sessionId));
      if (!s) return void send(res, 404, { error: 'unknown session', code: 'UNKNOWN_SESSION' });
      let dealPrice;
      try {
        dealPrice = acceptStanding(s);
      } catch {
        return void send(res, 409, { error: 'negotiation closed' });
      }
      s.state = 'closed';
      const tierIndex = TIERS.indexOf(dealPrice);
      const message = await sellerMessage('accept', { dealPrice, askPrice: dealPrice }, s.rounds);
      return void send(res, 200, {
        ...publicView(s),
        message,
        dealPrice,
        packageId: PACKAGES[tierIndex],
        expiresAt: new Date(Date.now() + OFFER_TTL_HOURS * 3600 * 1000).toISOString(),
      });
    }

    send(res, 404, { error: 'not found' });
  } catch (err) {
    send(res, 500, { error: 'internal error' });
    console.error(`[spoke] ${req.method} ${url.pathname}: ${err instanceof Error ? err.message : err}`);
  }
});

server.listen(PORT, () => {
  console.log(`spoke-seller listening on :${PORT} (${TIERS.length} tiers, ${fmt(TIERS[0])} … ${fmt(TIERS[TIERS.length - 1])})`);
});
