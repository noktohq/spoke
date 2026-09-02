// RevenueCat wrapper. Dynamic import keeps Expo Go working (no native module
// there — purchases fall back to a mock so the flow stays demoable). In the
// real dev/production build the entitlement is the source of truth.
const RC_API_KEY = 'test_quBRWnsPiQcrbQChCBAYtglGrMG'; // public SDK key; bytt til goog_-nøkkel når Play-appen kobles
export const ENTITLEMENT_ID = 'spoke_pro';

let purchases: any = null;

export async function initPurchases(): Promise<void> {
  try {
    const mod = await import('react-native-purchases');
    purchases = mod.default;
    purchases.setLogLevel(mod.LOG_LEVEL.DEBUG);
    purchases.configure({ apiKey: RC_API_KEY });
  } catch {
    purchases = null; // Expo Go — mock mode
  }
}

export function isMock(): boolean {
  return purchases == null;
}

export async function hasEntitlement(): Promise<boolean> {
  if (!purchases) return false;
  try {
    const info = await purchases.getCustomerInfo();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}

/** Fires on every purchase/renewal/expiry — keeps premium state in sync. */
export function onEntitlementChange(cb: (active: boolean) => void): void {
  if (!purchases) return;
  purchases.addCustomerInfoUpdateListener((info: any) =>
    cb(!!info.entitlements.active[ENTITLEMENT_ID])
  );
}

/** Purchase the negotiated package. Returns true when Spoke+ is unlocked,
 *  false when the user cancelled; throws on real errors. */
export async function purchasePackage(packageId: string): Promise<boolean> {
  if (!purchases) return true; // mock purchase in Expo Go
  const offerings = await purchases.getOfferings();
  const pkgs = offerings.current?.availablePackages ?? [];
  const pkg = pkgs.find((p: any) => p.identifier === packageId || p.product?.identifier === packageId);
  // Expo Go's Preview API Mode configures fine but serves mock offerings that
  // won't contain our tier packages — treat that as a mock purchase in dev.
  if (!pkg && __DEV__) return true;
  if (!pkg) throw new Error(`package ${packageId} not in current offering`);
  try {
    const { customerInfo } = await purchases.purchasePackage(pkg);
    return !!customerInfo.entitlements.active[ENTITLEMENT_ID];
  } catch (e: any) {
    if (e?.userCancelled) return false;
    throw e;
  }
}

export async function restorePurchases(): Promise<boolean> {
  if (!purchases) return false;
  try {
    const info = await purchases.restorePurchases();
    return !!info.entitlements.active[ENTITLEMENT_ID];
  } catch {
    return false;
  }
}
