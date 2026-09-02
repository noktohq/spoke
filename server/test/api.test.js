// Black-box test: boots the real server as a child process and negotiates
// a full session over HTTP — the exact loop the app performs.
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const PORT = 8912;
const BASE = `http://127.0.0.1:${PORT}`;
const entry = fileURLToPath(new URL('../src/index.js', import.meta.url));
let child;

before(async () => {
  child = spawn(process.execPath, [entry], { env: { ...process.env, PORT: String(PORT), ANTHROPIC_API_KEY: '' } });
  for (let i = 0; i < 100; i++) {
    try {
      const r = await fetch(`${BASE}/healthz`);
      if (r.ok) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error('server never became healthy');
});

after(() => child?.kill());

const post = async (path, body) => {
  const r = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return { status: r.status, json: await r.json() };
};

test('full loop: open, haggle, accept — deal is a tier with a package id and 48h expiry', async () => {
  const s = await post('/api/session', {});
  assert.equal(s.status, 200);
  assert.equal(s.json.listPrice, 3990);
  assert.match(s.json.message, /39\.90/);

  const o1 = await post('/api/offer', { sessionId: s.json.sessionId, offerMinor: 2000 });
  assert.equal(o1.status, 200);
  assert.ok(['counter', 'reject', 'accept'].includes(o1.json.decision));
  assert.ok(o1.json.askPrice <= 3990);

  const a = await post('/api/accept', { sessionId: s.json.sessionId });
  assert.equal(a.status, 200);
  assert.ok([3990, 3490, 2990, 2490, 1990].includes(a.json.dealPrice));
  assert.match(a.json.packageId, /^spoke_plus_\d+$/);
  assert.equal(a.json.packageId, `spoke_plus_${a.json.dealPrice}`);
  const ttl = new Date(a.json.expiresAt).getTime() - Date.now();
  assert.ok(ttl > 47 * 3600e3 && ttl < 49 * 3600e3);
});

test('the floor holds over the wire and the tier list never leaks', async () => {
  const s = await post('/api/session', {});
  for (let i = 0; i < 8; i++) {
    const o = await post('/api/offer', { sessionId: s.json.sessionId, offerMinor: 1 });
    if (o.status !== 200) continue;
    assert.ok(o.json.askPrice >= 1990, `ask ${o.json.askPrice} below floor`);
    assert.ok(!JSON.stringify(o.json).includes('tiers'));
  }
  const a = await post('/api/accept', { sessionId: s.json.sessionId });
  assert.ok(a.json.dealPrice >= 1990);
});

test('unknown session gives the stable code the app self-heals on', async () => {
  const o = await post('/api/offer', { sessionId: 'NOPE', offerMinor: 2000 });
  assert.equal(o.status, 404);
  assert.equal(o.json.code, 'UNKNOWN_SESSION');
});

test('accept twice is rejected — one deal per negotiation', async () => {
  const s = await post('/api/session', {});
  await post('/api/accept', { sessionId: s.json.sessionId });
  const again = await post('/api/accept', { sessionId: s.json.sessionId });
  assert.equal(again.status, 409);
});
