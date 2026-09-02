// RevenueCat wrapper. In Expo Go (no native module) it falls back to a mock
// purchase so the whole flow is demoable before the dev build exists.
const RC_API_KEY = 'appl_REPLACE_ME'; // RevenueCat public SDK key (iOS)

let purchases: any = null;

export async function initPurchases(): Promise<void> {
  try {
    const mod = await import('react-native-purchases');
    purchases = mod.default;
    purchases.configure({ apiKey: RC_API_KEY });
  } catch {
    purchases = null; // Expo Go — mock mode
  }
}

/** Purchase the negotiated package. Returns true when Spoke+ is unlocked. */
export async function purchasePackage(packageId: string): Promise<boolean> {
  if (!purchases) return true; // mock purchase in Expo Go
  const offerings = await purchases.getOfferings();
  const pkg = offerings.current?.availablePackages.find((p: any) => p.identifier === packageId);
  if (!pkg) throw new Error(`package ${packageId} not in current offering`);
  const { customerInfo } = await purchases.purchasePackage(pkg);
  return !!customerInfo.entitlements.active['spoke_plus'];
}
