// @ts-check
// The dealer's voice. Prices are decided by the engine before this file is
// consulted — an LLM may only phrase, never move a number (same guard as
// Haggle: replies that don't quote the authoritative price are discarded).

const CURRENCY = process.env.CURRENCY || 'NOK';

/**
 * Minor units → display string, e.g. 3990 → "39.90 NOK".
 * @param {number} minor
 */
export function fmt(minor) {
  return `${(minor / 100).toFixed(2)} ${CURRENCY}`;
}

/**
 * @typedef {object} VoiceParams
 * @property {number} [offer]
 * @property {number} [askPrice]
 * @property {number} [dealPrice]
 */

/** @type {Record<string, ((p: VoiceParams) => string)[]>} */
const T = {
  open: [
    (p) => `Welcome to my shop! Spoke+ is ${fmt(/** @type {number} */ (p.askPrice))} a month — but I do love a good haggle. Make me an offer.`,
  ],
  accept: [
    (p) => `Deal! ${fmt(/** @type {number} */ (p.dealPrice))} a month for Spoke+ — well haggled. That price is yours for 48 hours.`,
    (p) => `Sold! ${fmt(/** @type {number} */ (p.dealPrice))}. You bargain better than most cyclists I know.`,
  ],
  counter: [
    (p) => `Hmm, that's a bit thin. I can stretch to ${fmt(/** @type {number} */ (p.askPrice))} — and that includes my good mood.`,
    (p) => `Almost! This rarely goes under ${fmt(/** @type {number} */ (p.askPrice))} — but at that price it's yours.`,
  ],
  reject: [
    (p) => `For Spoke+? Now you're pulling my chain. ${fmt(/** @type {number} */ (p.askPrice))} is my answer.`,
  ],
  final: [
    (p) => `Final offer: ${fmt(/** @type {number} */ (p.askPrice))}. Take it, or come haggle again another day.`,
  ],
  closed: [() => `This negotiation is closed. Start a new one if you want another go.`],
};

/**
 * @param {string} kind
 * @param {VoiceParams} params
 * @param {number} round
 * @returns {Promise<string>}
 */
export async function sellerMessage(kind, params, round) {
  const list = T[kind] || T.closed;
  const fallback = list[round % list.length](params);
  const key = process.env.ANTHROPIC_API_KEY;
  if (!key) return fallback;
  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-api-key': key, 'anthropic-version': '2023-06-01' },
      body: JSON.stringify({
        model: process.env.SELLER_MODEL || 'claude-haiku-4-5-20251001',
        max_tokens: 150,
        system:
          'You are a charming, slightly witty Norwegian bike dealer selling the Spoke+ subscription. ' +
          'Write ONE short reply in English (max 2 sentences). You MUST quote exactly the price you are given — ' +
          'never mention other numbers, never promise more discount. Write prices without thousand separators.',
        messages: [
          {
            role: 'user',
            content: `Situation: ${kind}. Buyer's offer: ${params.offer != null ? fmt(params.offer) : '-'}. Your authoritative price: ${fmt(/** @type {number} */ (params.askPrice ?? params.dealPrice))}. Write your reply.`,
          },
        ],
      }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return fallback;
    const body = /** @type {any} */ (await res.json());
    const text = (body.content?.[0]?.text || '').trim();
    // Guard: must quote the authoritative price (digits, separators stripped).
    const must = ((/** @type {number} */ (params.askPrice ?? params.dealPrice)) / 100).toFixed(2).replace('.', '');
    const stripped = text.replace(/[\s  .,]/g, '');
    if (!text || !new RegExp(`(^|\\D)${must}(\\D|$)`).test(stripped)) return fallback;
    return text;
  } catch {
    return fallback;
  }
}
