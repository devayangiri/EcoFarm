/**
 * Application Feature Flags & Phase Enablement Configuration
 *
 * Distinguishes:
 * - CASE A: Future-phase features (tables/services not yet available in current Phase 3 core schema)
 * - CASE B: Implemented features with zero data (genuine empty state)
 * - CASE C: Active features experiencing unexpected database/runtime failures (controlled error state)
 */
export const FEATURES = {
  // Phase 4: Buyer procurement RFQs and product bookmarks
  SAVED_PRODUCTS: false,
  BUYER_REQUIREMENTS: false,

  // Phase 5: Granular shipment milestones
  ORDER_TIMELINES: false,

  // Phase 6: Ratings and peer reviews
  REVIEWS: false,

  // Phase 7: Buyer service requests and quotation workflow
  SERVICE_REQUESTS: false,

  // Phase 8: Multi-vendor cart and checkout session
  CART_AND_CHECKOUT: false,
} as const;

export type FeatureKey = keyof typeof FEATURES;

export function isFeatureEnabled(feature: FeatureKey): boolean {
  return FEATURES[feature] ?? false;
}

export function setFeatureFlag(feature: FeatureKey, enabled: boolean): void {
  (FEATURES as any)[feature] = enabled;
}
