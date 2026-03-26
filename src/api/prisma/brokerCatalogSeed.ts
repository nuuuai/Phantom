import type {
  BrokerCategory,
  RemovalMethod,
} from "@prisma/client";
import { REMOVAL_URL_BY_DOMAIN } from "./brokerRemovalUrlsSeed.js";

export interface BrokerSeedRow {
  name: string;
  domain: string;
  category: BrokerCategory;
  removalMethod: RemovalMethod;
  avgRemovalDays: number;
  removalUrl?: string | null;
  removalNotes?: string | null;
}

const DIY_FALLBACK_NOTE =
  "No verified link in Phantom yet — open the broker site and use Privacy, CCPA, or “Do not sell my data.”";

const SCALE_CATEGORIES: BrokerCategory[] = [
  "people_search",
  "marketing",
  "data_aggregator",
  "background_check",
  "public_records",
];

const SCALE_REMOVAL: RemovalMethod[] = ["form", "email", "manual", "api"];

/** 50 real data broker sites — registry for Phase 1 simulation */
const BROKER_CATALOG_CORE_RAW = [
  { name: "Spokeo", domain: "spokeo.com", category: "people_search", removalMethod: "form", avgRemovalDays: 14 },
  { name: "WhitePages", domain: "whitepages.com", category: "people_search", removalMethod: "form", avgRemovalDays: 10 },
  { name: "BeenVerified", domain: "beenverified.com", category: "background_check", removalMethod: "form", avgRemovalDays: 21 },
  { name: "Intelius", domain: "intelius.com", category: "people_search", removalMethod: "email", avgRemovalDays: 18 },
  { name: "TruePeopleSearch", domain: "truepeoplesearch.com", category: "people_search", removalMethod: "form", avgRemovalDays: 12 },
  { name: "FastPeopleSearch", domain: "fastpeoplesearch.com", category: "people_search", removalMethod: "form", avgRemovalDays: 14 },
  { name: "Radaris", domain: "radaris.com", category: "people_search", removalMethod: "form", avgRemovalDays: 16 },
  { name: "MyLife", domain: "mylife.com", category: "people_search", removalMethod: "email", avgRemovalDays: 20 },
  { name: "ZabaSearch", domain: "zabasearch.com", category: "people_search", removalMethod: "form", avgRemovalDays: 15 },
  { name: "PeopleFinder", domain: "peoplefinder.com", category: "people_search", removalMethod: "form", avgRemovalDays: 14 },
  { name: "USSearch", domain: "ussearch.com", category: "people_search", removalMethod: "email", avgRemovalDays: 17 },
  { name: "Pipl", domain: "pipl.com", category: "data_aggregator", removalMethod: "api", avgRemovalDays: 7 },
  { name: "ThatsThem", domain: "thatsthem.com", category: "people_search", removalMethod: "form", avgRemovalDays: 11 },
  { name: "Addresses.com", domain: "addresses.com", category: "public_records", removalMethod: "form", avgRemovalDays: 22 },
  { name: "PublicRecordsNow", domain: "publicrecordsnow.com", category: "public_records", removalMethod: "form", avgRemovalDays: 25 },
  { name: "CyberBackgroundChecks", domain: "cyberbackgroundchecks.com", category: "background_check", removalMethod: "form", avgRemovalDays: 19 },
  { name: "Instant Checkmate", domain: "instantcheckmate.com", category: "background_check", removalMethod: "form", avgRemovalDays: 24 },
  { name: "PeopleLooker", domain: "peoplelooker.com", category: "background_check", removalMethod: "email", avgRemovalDays: 21 },
  { name: "CocoFinder", domain: "cocofinder.com", category: "people_search", removalMethod: "form", avgRemovalDays: 13 },
  { name: "NumberGuru", domain: "numberguru.com", category: "people_search", removalMethod: "form", avgRemovalDays: 12 },
  { name: "CallerSmart", domain: "callersmart.com", category: "people_search", removalMethod: "manual", avgRemovalDays: 30 },
  { name: "Nuwber", domain: "nuwber.com", category: "people_search", removalMethod: "form", avgRemovalDays: 14 },
  { name: "Whitepages Premium", domain: "premium.whitepages.com", category: "people_search", removalMethod: "form", avgRemovalDays: 10 },
  { name: "AnyWho", domain: "anywho.com", category: "people_search", removalMethod: "form", avgRemovalDays: 16 },
  { name: "411.com", domain: "411.com", category: "people_search", removalMethod: "form", avgRemovalDays: 18 },
  { name: "CheckPeople", domain: "checkpeople.com", category: "background_check", removalMethod: "form", avgRemovalDays: 20 },
  { name: "SearchPeopleFree", domain: "searchpeoplefree.com", category: "people_search", removalMethod: "form", avgRemovalDays: 15 },
  { name: "TruthFinder", domain: "truthfinder.com", category: "background_check", removalMethod: "email", avgRemovalDays: 28 },
  { name: "SocialCatfish", domain: "socialcatfish.com", category: "data_aggregator", removalMethod: "form", avgRemovalDays: 17 },
  { name: "PeopleSmart", domain: "peoplesmart.com", category: "people_search", removalMethod: "form", avgRemovalDays: 14 },
  { name: "InfoTracer", domain: "infotracer.com", category: "public_records", removalMethod: "form", avgRemovalDays: 23 },
  { name: "AdvancedBackgroundChecks", domain: "advancedbackgroundchecks.com", category: "background_check", removalMethod: "form", avgRemovalDays: 26 },
  { name: "PublicDataCheck", domain: "publicdatacheck.com", category: "public_records", removalMethod: "form", avgRemovalDays: 22 },
  { name: "NewEnglandFacts", domain: "newenglandfacts.com", category: "public_records", removalMethod: "manual", avgRemovalDays: 30 },
  { name: "OldFriends", domain: "oldfriends.com", category: "marketing", removalMethod: "email", avgRemovalDays: 14 },
  { name: "Reunion.com", domain: "reunion.com", category: "marketing", removalMethod: "form", avgRemovalDays: 18 },
  { name: "Classmates", domain: "classmates.com", category: "marketing", removalMethod: "form", avgRemovalDays: 16 },
  { name: "FamilyTreeNow", domain: "familytreenow.com", category: "people_search", removalMethod: "form", avgRemovalDays: 12 },
  { name: "Archives.com", domain: "archives.com", category: "public_records", removalMethod: "email", avgRemovalDays: 27 },
  { name: "US-Info", domain: "us-info.com", category: "people_search", removalMethod: "form", avgRemovalDays: 15 },
  { name: "VoterRecords", domain: "voterrecords.com", category: "public_records", removalMethod: "form", avgRemovalDays: 30 },
  { name: "HomeFacts", domain: "homefacts.com", category: "public_records", removalMethod: "form", avgRemovalDays: 21 },
  { name: "PropertyShark", domain: "propertyshark.com", category: "public_records", removalMethod: "email", avgRemovalDays: 19 },
  { name: "BlockShopper", domain: "blockshopper.com", category: "marketing", removalMethod: "manual", avgRemovalDays: 25 },
  { name: "NeighborWho", domain: "neighborwho.com", category: "people_search", removalMethod: "form", avgRemovalDays: 14 },
  { name: "AddressSearch", domain: "addresssearch.com", category: "people_search", removalMethod: "form", avgRemovalDays: 13 },
  { name: "PhoneOwner", domain: "phoneowner.com", category: "people_search", removalMethod: "form", avgRemovalDays: 12 },
  { name: "SmartBackgroundChecks", domain: "smartbackgroundchecks.com", category: "background_check", removalMethod: "form", avgRemovalDays: 22 },
  { name: "PeopleWhiz", domain: "peoplewhiz.com", category: "people_search", removalMethod: "form", avgRemovalDays: 15 },
  { name: "IDcrawl", domain: "idcrawl.com", category: "data_aggregator", removalMethod: "form", avgRemovalDays: 11 },
] as const;

export const BROKER_CATALOG_CORE: readonly BrokerSeedRow[] =
  BROKER_CATALOG_CORE_RAW.map((r) => {
    const url = REMOVAL_URL_BY_DOMAIN[r.domain] ?? null;
    return {
      name: r.name,
      domain: r.domain,
      category: r.category,
      removalMethod: r.removalMethod,
      avgRemovalDays: r.avgRemovalDays,
      removalUrl: url,
      removalNotes: url ? null : DIY_FALLBACK_NOTE,
    };
  });

/**
 * Synthetic registry rows (unique `.example` domains) so the catalog reaches 150+ brokers
 * for scale testing; replace with additional real brokers over time.
 */
export const BROKER_CATALOG_SCALE: readonly BrokerSeedRow[] = Array.from(
  { length: 100 },
  (_, i) => {
    const n = i + 51;
    return {
      name: `Registry broker ${String(n).padStart(3, "0")}`,
      domain: `phantom-broker-${String(n).padStart(3, "0")}.example`,
      category: SCALE_CATEGORIES[i % SCALE_CATEGORIES.length]!,
      removalMethod: SCALE_REMOVAL[i % SCALE_REMOVAL.length]!,
      avgRemovalDays: 7 + (i % 25),
      removalUrl: null,
      removalNotes:
        "Registry placeholder — search the site for privacy, CCPA, or opt-out.",
    };
  }
);

export const BROKER_CATALOG_SEED: readonly BrokerSeedRow[] = [
  ...BROKER_CATALOG_CORE,
  ...BROKER_CATALOG_SCALE,
];
