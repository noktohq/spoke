// Client for the Spoke seller API. The negotiation lives server-side; the app
// only relays offers and renders the dealer's replies.
const BASE = process.env.EXPO_PUBLIC_SELLER_API || 'http://localhost:8080';

export type SellerState = {
  sessionId?: string;
  message: string;
  decision?: string;
  askPrice: number;
  listPrice: number;
  rounds: number;
  maxRounds: number;
  state: 'open' | 'agreed' | 'closed';
  dealPrice: number | null;
  packageId?: string;
  expiresAt?: string;
};

async function post(path: string, body: object): Promise<any> {
  const res = await fetch(BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = Object.assign(new Error(json.error || `API ${res.status}`), { code: json.code });
    throw err;
  }
  return json;
}

export const openSession = (): Promise<SellerState> => post('/api/session', {});
export const makeOffer = (sessionId: string, offerMinor: number): Promise<SellerState> =>
  post('/api/offer', { sessionId, offerMinor });
export const acceptDeal = (sessionId: string): Promise<SellerState> => post('/api/accept', { sessionId });
export const isLostSession = (e: unknown): boolean => (e as any)?.code === 'UNKNOWN_SESSION';
