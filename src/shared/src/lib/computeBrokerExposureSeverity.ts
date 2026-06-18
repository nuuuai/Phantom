import type { BrokerDataType } from "../constants/brokerDataTypes.js";

const TYPE_WEIGHT: Record<BrokerDataType, number> = {
  name: 8,
  email: 12,
  phone: 14,
  address: 18,
  age: 10,
  relatives: 16,
};

/**
 * Scores broker exposure severity 0–100 from data types found on a listing.
 * Higher weight for address, relatives, phone — aligns with Brain prioritization spec.
 */
export function computeBrokerExposureSeverity(
  dataTypesFound: readonly string[]
): number {
  if (dataTypesFound.length === 0) return 25;

  let score = 0;
  const seen = new Set<string>();

  for (const raw of dataTypesFound) {
    const key = raw.toLowerCase().trim();
    if (seen.has(key)) continue;
    seen.add(key);

    if (key in TYPE_WEIGHT) {
      score += TYPE_WEIGHT[key as BrokerDataType];
    } else if (key.includes("ssn") || key.includes("social")) {
      score += 35;
    } else {
      score += 6;
    }
  }

  return Math.min(100, Math.max(0, Math.round(score)));
}
