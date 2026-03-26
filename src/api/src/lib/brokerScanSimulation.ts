import type { BrokerCategory, BrokerScanStatus, DataBroker } from "@prisma/client";
import { createHash } from "node:crypto";

const ALL_DATA_TYPES = [
  "name",
  "phone",
  "email",
  "address",
  "age",
  "relatives",
] as const;

export type SimulatedDataType = (typeof ALL_DATA_TYPES)[number];

const BIG_BROKER_NAMES = new Set<string>([
  "Spokeo",
  "WhitePages",
  "BeenVerified",
  "Intelius",
  "TruthFinder",
  "Instant Checkmate",
]);

function hashSeed(parts: string[]): number {
  const h = createHash("sha256").update(parts.join("|")).digest();
  return h.readUInt32BE(0);
}

function prng01(seed: number): number {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function pickDataTypes(
  category: BrokerCategory,
  brokerName: string,
  seed: number
): SimulatedDataType[] {
  const base: SimulatedDataType[] = ["name"];

  const maybeAdd = (t: SimulatedDataType, threshold: number): void => {
    if (prng01(seed + t.length * 131 + ALL_DATA_TYPES.indexOf(t) * 17) < threshold) {
      base.push(t);
    }
  };

  switch (category) {
    case "people_search":
      maybeAdd("phone", 0.85);
      maybeAdd("email", 0.75);
      maybeAdd("address", 0.7);
      maybeAdd("age", 0.55);
      maybeAdd("relatives", 0.45);
      break;
    case "background_check":
      maybeAdd("phone", 0.8);
      maybeAdd("email", 0.65);
      maybeAdd("address", 0.6);
      maybeAdd("age", 0.5);
      maybeAdd("relatives", 0.35);
      break;
    case "public_records":
      maybeAdd("address", 0.75);
      maybeAdd("age", 0.4);
      maybeAdd("phone", 0.5);
      maybeAdd("email", 0.35);
      maybeAdd("relatives", 0.25);
      break;
    case "data_aggregator":
      maybeAdd("email", 0.7);
      maybeAdd("phone", 0.55);
      maybeAdd("address", 0.35);
      maybeAdd("age", 0.25);
      break;
    case "marketing":
      maybeAdd("email", 0.65);
      maybeAdd("phone", 0.25);
      maybeAdd("address", 0.2);
      break;
    default:
      break;
  }

  if (BIG_BROKER_NAMES.has(brokerName)) {
    for (const t of ALL_DATA_TYPES) {
      if (!base.includes(t) && prng01(seed + t.charCodeAt(0) * 7) < 0.55) {
        base.push(t);
      }
    }
  }

  const uniq = [...new Set(base)];
  return uniq.sort(
    (a, b) => ALL_DATA_TYPES.indexOf(a) - ALL_DATA_TYPES.indexOf(b)
  );
}

export function randomTargetFoundFraction(userId: string): number {
  const s = hashSeed([userId, "target-fraction"]);
  return 0.3 + prng01(s) * 0.3;
}

/** Which broker indices are "found" for this scan — ~30–60% plus major brokers */
export function selectFoundBrokerIndices(
  brokers: readonly { name: string }[],
  userId: string,
  targetFraction: number
): Set<number> {
  const n = brokers.length;
  const targetCount = Math.round(n * targetFraction);
  const big = new Set<number>();
  brokers.forEach((b, i) => {
    if (BIG_BROKER_NAMES.has(b.name)) {
      big.add(i);
    }
  });

  const found = new Set(big);
  const rest = brokers.map((_, i) => i).filter((i) => !big.has(i));
  const seed = hashSeed([userId, "found-pick"]);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(prng01(seed + i * 13) * (i + 1));
    const tmp = rest[i]!;
    rest[i] = rest[j]!;
    rest[j] = tmp;
  }
  const need = Math.max(0, targetCount - big.size);
  for (let i = 0; i < need && i < rest.length; i++) {
    found.add(rest[i]!);
  }
  return found;
}

export function simulateOneBroker(
  broker: DataBroker,
  userId: string,
  isFound: boolean
): { status: BrokerScanStatus; dataTypesFound: SimulatedDataType[] } {
  const seed = hashSeed([userId, broker.id]);
  if (!isFound) {
    return { status: "not_found", dataTypesFound: [] };
  }
  return {
    status: "found",
    dataTypesFound: pickDataTypes(broker.category, broker.name, seed),
  };
}
