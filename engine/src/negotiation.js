// @ts-check
// Tier-based negotiation engine for Spoke's negotiable subscription.
// Ported from the Haggle engine (github.com/noktohq/haggle): all price
// authority lives here, server-side. The buyer's offers land on one of the
// merchant's pre-approved store price tiers — never below the lowest tier,
// which is the structural floor. A voice (LLM or template) may only phrase
// the outcome, never move it.

/**
 * @typedef {object} Session
 * @property {number[]} tiers    Descending prices in minor units, e.g. [399,349,299,249,199]
 * @property {number} askIndex   Seller's standing tier (index into tiers)
 * @property {number} rounds
 * @property {'open'|'agreed'|'closed'} state
 * @property {number|null} dealIndex
 * @property {{who:'buyer'|'seller', price:number, accepted?:boolean, final?:boolean, lowball?:boolean}[]} history
 */

/**
 * @typedef {object} Decision
 * @property {'accept'|'counter'|'reject'|'final'|'closed'} kind
 * @property {number} askPrice   Seller's standing price after this offer
 * @property {number} [dealPrice]
 */

const MAX_ROUNDS = 6;

/**
 * @param {number[]} tiers  Descending, at least 2 entries; tiers[0] is list
 *                          price, tiers[tiers.length-1] is the hard floor.
 * @returns {Session}
 */
export function createNegotiation(tiers) {
  if (!Array.isArray(tiers) || tiers.length < 2) throw new Error('need at least 2 tiers');
  for (let i = 1; i < tiers.length; i++) {
    if (!(tiers[i] < tiers[i - 1]) || !Number.isInteger(tiers[i])) throw new Error('tiers must be descending integers');
  }
  if (!Number.isInteger(tiers[0]) || tiers[tiers.length - 1] <= 0) throw new Error('tiers must be positive integers');
  return { tiers: [...tiers], askIndex: 0, rounds: 0, state: 'open', dealIndex: null, history: [] };
}

/**
 * The lowest tier index the seller accepts at, easing toward the floor tier
 * as rounds pass: round 1 unlocks index 1, …, the floor tier only in the
 * final rounds. Lazy bids close high; the floor takes persistence.
 * @param {Session} s
 */
function acceptIndex(s) {
  const last = s.tiers.length - 1;
  return Math.min(last, Math.ceil((s.rounds / MAX_ROUNDS) * last));
}

/**
 * Apply one buyer offer (minor units). Mutates the session.
 * @param {Session} s
 * @param {unknown} rawOffer
 * @returns {Decision}
 */
export function applyOffer(s, rawOffer) {
  if (s.state !== 'open') return { kind: 'closed', askPrice: s.tiers[s.askIndex] };
  const offer = Math.round(Number(rawOffer));
  if (!Number.isFinite(offer) || offer <= 0) throw new Error('invalid offer');

  s.rounds = Math.min(s.rounds + 1, MAX_ROUNDS);
  s.history.push({ who: 'buyer', price: offer });

  // Meets or beats the standing ask → deal at the ask (never charge more).
  if (offer >= s.tiers[s.askIndex]) return seal(s, s.askIndex);

  // Offer covers an unlockable tier → deal at the best tier the offer covers.
  const unlocked = acceptIndex(s);
  for (let i = s.askIndex + 1; i <= unlocked; i++) {
    if (offer >= s.tiers[i]) return seal(s, i);
  }

  const last = s.tiers.length - 1;
  const lowball = offer < s.tiers[last] * 0.6;

  // Out of rounds → the standing ask is final; only accept_deal remains.
  if (s.rounds >= MAX_ROUNDS) {
    s.history.push({ who: 'seller', price: s.tiers[s.askIndex], final: true });
    return { kind: 'final', askPrice: s.tiers[s.askIndex] };
  }

  // Concede one tier (none on a lowball), never past the floor.
  if (!lowball && s.askIndex < last) s.askIndex += 1;
  s.history.push({ who: 'seller', price: s.tiers[s.askIndex], lowball });
  return { kind: lowball ? 'reject' : 'counter', askPrice: s.tiers[s.askIndex] };
}

/**
 * @param {Session} s
 * @param {number} index
 * @returns {Decision}
 */
function seal(s, index) {
  s.state = 'agreed';
  s.dealIndex = index;
  s.askIndex = index;
  s.history.push({ who: 'seller', price: s.tiers[index], accepted: true });
  return { kind: 'accept', askPrice: s.tiers[index], dealPrice: s.tiers[index] };
}

/**
 * Buyer takes the standing ask.
 * @param {Session} s
 * @returns {number} deal price in minor units
 */
export function acceptStanding(s) {
  if (s.state === 'agreed') return s.tiers[/** @type {number} */ (s.dealIndex)];
  if (s.state !== 'open') throw new Error('negotiation closed');
  return /** @type {number} */ (seal(s, s.askIndex).dealPrice);
}

/**
 * Client-safe view: prices only, never the tier list or how far it goes.
 * @param {Session} s
 */
export function publicView(s) {
  return {
    askPrice: s.tiers[s.askIndex],
    listPrice: s.tiers[0],
    rounds: s.rounds,
    maxRounds: MAX_ROUNDS,
    state: s.state,
    dealPrice: s.dealIndex == null ? null : s.tiers[s.dealIndex],
  };
}

export { MAX_ROUNDS };
