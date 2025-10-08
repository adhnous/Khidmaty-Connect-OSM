import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export type FeaturesSettings = {
  pricingEnabled: boolean;
  showForProviders: boolean;
  showForSeekers: boolean;
  enforceAfterMonths: number; // default visibility after N months registered
  // Owner-enforced lock: redirect to /pricing so only pricing is visible
  lockAllToPricing?: boolean;
  lockProvidersToPricing?: boolean;
  lockSeekersToPricing?: boolean;
};

export const DEFAULT_FEATURES: FeaturesSettings = {
  pricingEnabled: true,
  showForProviders: false,
  showForSeekers: false,
  enforceAfterMonths: 3,
  lockAllToPricing: false,
  lockProvidersToPricing: false,
  lockSeekersToPricing: false,
};

export async function getFeatures(): Promise<FeaturesSettings> {
  try {
    const ref = doc(db, 'settings', 'features');
    const snap = await getDoc(ref);
    if (!snap.exists()) return DEFAULT_FEATURES;
    const data = snap.data() as Partial<FeaturesSettings>;
    return {
      pricingEnabled: data.pricingEnabled ?? DEFAULT_FEATURES.pricingEnabled,
      showForProviders: data.showForProviders ?? DEFAULT_FEATURES.showForProviders,
      showForSeekers: data.showForSeekers ?? DEFAULT_FEATURES.showForSeekers,
      enforceAfterMonths: data.enforceAfterMonths ?? DEFAULT_FEATURES.enforceAfterMonths,
      lockAllToPricing: data.lockAllToPricing ?? DEFAULT_FEATURES.lockAllToPricing,
      lockProvidersToPricing: data.lockProvidersToPricing ?? DEFAULT_FEATURES.lockProvidersToPricing,
      lockSeekersToPricing: data.lockSeekersToPricing ?? DEFAULT_FEATURES.lockSeekersToPricing,
    };
  } catch {
    return DEFAULT_FEATURES;
  }
}

export async function saveFeatures(next: FeaturesSettings): Promise<void> {
  const ref = doc(db, 'settings', 'features');
  await setDoc(ref, next, { merge: true });
}
