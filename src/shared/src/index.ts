export type {
  Alias,
  AliasType,
  AliasCategory,
  HealthStatus,
  GenerateAliasRequest,
  PatchAliasRequest,
} from "./types/alias.js";
export type { User } from "./types/user.js";
export type {
  AliasTypeUsage,
  UserAccountSnapshot,
} from "./types/userAccount.js";
export { FREE_TIER_ALIAS_MAX } from "./constants/tierLimits.js";
export { RATE_LIMIT_RETRY_MS } from "./constants/http.js";
export type { ThreatPattern } from "./types/threatPattern.js";
export type {
  BrokerCategory,
  BrokerRemovalMethod,
  BrokerScanResult,
  BrokerScanStartResponse,
  BrokerScanSummary,
  DataBroker,
  ScanStatus,
} from "./types/brokerScan.js";
export type { BrokerDataType } from "./constants/brokerDataTypes.js";
export { BROKER_DATA_TYPES } from "./constants/brokerDataTypes.js";
export type { RiskScore } from "./types/riskScore.js";
export type { ActivityLayerType } from "./types/activityLayer.js";
export type {
  ActivityItem,
  DashboardOverview,
  SystemLayerStatus,
} from "./types/dashboardOverview.js";
export type { ApiResponse, ApiFailure, ApiSuccess } from "./types/apiResponse.js";
export type {
  NotificationCategory,
  NotificationPrefItem,
  NotificationPriority,
  PhantomNotification,
} from "./types/notification.js";
export {
  ALIAS_CATEGORIES,
  type AliasCategoryId,
} from "./constants/aliasCategories.js";
export { HEALTH_STATUS_VALUES } from "./constants/healthStatus.js";
export { RISK_THRESHOLDS } from "./constants/riskThresholds.js";
export {
  generateVaultSalt,
  deriveVaultKey,
  encryptVaultValue,
  decryptVaultValue,
  generatePassword,
  exportKeyHex,
  importKeyHex,
} from "./lib/vaultCrypto.js";
export type { VaultPayload } from "./lib/vaultCrypto.js";
