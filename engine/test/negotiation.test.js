import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createNegotiation, applyOffer, acceptStanding, publicView, MAX_ROUNDS } from '../src/negotiation.js';

const TIERS = [399, 349, 299, 249, 199]; // list … floor, minor units

test('floor is never breached, whatever the buyer does', () => {
  const s = createNegotiation(TIERS);
  for (let i = 0; i < 20; i++) {
    try { applyOffer(s, 1); } catch {}
    assert.ok(s.tiers[s.askIndex] >= 199);
    if (s.dealIndex != null) assert.ok(s.tiers[s.dealIndex] >= 199);
  }
});

test('every outcome lands exactly on a tier', () => {
  for (const bid of [200, 250, 260, 300, 350, 500]) {
    const s = createNegotiation(TIERS);
    applyOffer(s, bid);
    applyOffer(s, bid);
    const price = acceptStanding(s);
    assert.ok(TIERS.includes(price), `deal ${price} not a tier`);
  }
});

test('meeting the ask closes at the ask, not more', () => {
  const s = createNegotiation(TIERS);
  const d = applyOffer(s, 999);
  assert.equal(d.kind, 'accept');
  assert.equal(d.dealPrice, 399);
});

test('lazy lowballs close high; the floor takes persistence', () => {
  const lazy = createNegotiation(TIERS);
  const d1 = applyOffer(lazy, 205); // decent bid, round 1
  // Round 1 only unlocks the second tier — 205 does not cover it.
  assert.notEqual(d1.kind, 'accept');
  const persistent = createNegotiation(TIERS);
  let d;
  for (let i = 0; i < MAX_ROUNDS && d?.kind !== 'accept'; i++) d = applyOffer(persistent, 205);
  // Within the round budget the floor tier unlocks and 205 covers it.
  assert.equal(d.kind, 'accept');
  assert.equal(d.dealPrice, 199);
});

test('hard lowballs get no concession', () => {
  const s = createNegotiation(TIERS);
  const d = applyOffer(s, 10);
  assert.equal(d.kind, 'reject');
  assert.equal(d.askPrice, 399);
});

test('seller only ever concedes, one tier at a time', () => {
  const s = createNegotiation(TIERS);
  let prev = 399;
  for (let i = 0; i < 4; i++) {
    const d = applyOffer(s, 150); // above 60% of floor, below every tier
    if (d.kind === 'accept') break;
    assert.ok(d.askPrice <= prev);
    assert.ok(prev - d.askPrice <= 50);
    prev = d.askPrice;
  }
});

test('rounds cap at MAX_ROUNDS and the final offer stands', () => {
  const s = createNegotiation(TIERS);
  for (let i = 0; i < MAX_ROUNDS + 3; i++) applyOffer(s, 150);
  assert.equal(s.rounds, MAX_ROUNDS);
  assert.equal(publicView(s).state, 'open');
  assert.equal(acceptStanding(s), s.tiers[s.askIndex]);
});

test('publicView never exposes the tier list', () => {
  const s = createNegotiation(TIERS);
  const v = publicView(s);
  assert.ok(!('tiers' in v) && !('askIndex' in v));
});

test('invalid tier lists are rejected', () => {
  assert.throws(() => createNegotiation([100]));
  assert.throws(() => createNegotiation([100, 200]));
  assert.throws(() => createNegotiation([200, 100.5]));
});
