export type {
  Alias,
  AliasType,
  AliasCategory,
  HealthStatus,
  GenerateAliasRequest,
  PatchAliasRequest,
} from "./types/alias.js";
export type { User } from "./types/user.js";
export type { PhoneProviderStatus } from "./types/phoneProvider.js";
export { isValidE164Phone } from "./lib/phoneE164.js";
export type {
  AliasInboxItem,
  AliasInboxListMeta,
} from "./types/aliasInbox.js";
export type {
  AliasTypeUsage,
  UserAccountSnapshot,
  AccountExportPayload,
  AccountExportAliasRow,
  AccountDeleteRequest,
  AccountDeleteResult,
} from "./types/userAccount.js";
export { FREE_TIER_ALIAS_MAX } from "./constants/tierLimits.js";
export { isFreeTierAliasTypeAtCap } from "./lib/tierQuota.js";
export { FREE_TIER_BROKER_SCAN_MAX_PER_24H } from "./constants/brokerScanQuota.js";
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
export {
  brokerRemovalLinkLabel,
  brokerRemovalMethodLabel,
  brokerRemovalSearchUrl,
  resolveBrokerRemovalHref,
} from "./lib/brokerRemovalHelp.js";
export type { BrokerDataType } from "./constants/brokerDataTypes.js";
export { BROKER_DATA_TYPES } from "./constants/brokerDataTypes.js";
export type { RiskScore } from "./types/riskScore.js";
export type { ActivityLayerType } from "./types/activityLayer.js";
export {
  buildRiskBand,
  buildRiskNarrative,
  buildRiskThresholdAction,
  buildSyntheticRiskTrendSeries,
  riskTrendFromSeries,
} from "./lib/buildRiskNarrative.js";
export type {
  RiskBand,
  RiskBandId,
  RiskNarrative,
  RiskTrendPoint,
} from "./types/riskNarrative.js";
export type {
  ActivityItem,
  DashboardOverview,
  SystemLayerStatus,
} from "./types/dashboardOverview.js";
export type {
  CopilotPrompt,
  IntelligenceItem,
  IntelligenceQuickAction,
  InboxVolumeSpikeSignal,
  PriorityAction,
  RiskFactor,
} from "./types/dashboardIntelligence.js";
export {
  buildCopilotPrompts,
  buildDailyBrief,
  buildIntelligenceItems,
  buildPriorityActions,
  buildRiskFactors,
  resolveCopilotResponse,
  type DashboardIntelligenceContext,
} from "./lib/buildDashboardIntelligence.js";
export { explainAliasHealth, type AliasHealthExplanation } from "./lib/explainAliasHealth.js";
export {
  scoreInboxPhishing,
  type InboxPhishingLevel,
  type InboxPhishingScore,
} from "./lib/scoreInboxPhishing.js";
export type {
  CopilotChatRequest,
  CopilotChatResponse,
  CopilotReplyMode,
  CopilotStatusResponse,
} from "./types/copilot.js";
export type {
  CopilotToolId,
  CopilotActionParams,
  CopilotPendingAction,
  CopilotConfirmRequest,
  CopilotConfirmResponse,
  CopilotToolIntent,
  CopilotRotateAliasParams,
} from "./types/copilotTools.js";
export { detectCopilotToolIntent } from "./lib/detectCopilotToolIntent.js";
export {
  checkPasswordPwned,
  sha1HexUpper,
  type PasswordPwnedResult,
} from "./lib/checkPasswordPwned.js";
export type {
  DarkWebFindingPublic,
  DarkWebFindingsListResponse,
  DarkWebFindingsSummary,
  DarkWebRefreshResult,
  DarkWebFindingStatus,
  DarkWebSeverity,
} from "./types/darkWebFinding.js";
export type {
  DarkWebImpactAnalysis,
  DarkWebImpactLink,
  DarkWebImpactSummary,
} from "./types/darkWebImpact.js";
export type {
  ApiResponse,
  ApiFailure,
  ApiSuccess,
  ApiErrorBody,
} from "./types/apiResponse.js";
export {
  PHANTOM_API_ERROR_CODES,
  type PhantomApiErrorCode,
} from "./constants/apiErrorCodes.js";
export type { BillingStatus } from "./types/billing.js";
export {
  normalizeClientError,
  clientErrorFromApiFailure,
  formatBrokerScanRateLimit,
  getQueryErrorMessage,
  type ClientErrorCode,
  type ClientErrorMeta,
} from "./lib/clientError.js";
export {
  FORWARD_EMAIL_RE,
  isValidForwardEmailInput,
  parseForwardToEmailPatchBody,
  type ParseForwardToEmailPatchResult,
} from "./lib/forwardEmail.js";
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
export {
  VAULT_SYNC_SCHEMA_VERSION,
  emptyVaultSyncPlaintext,
  parseVaultSyncPlaintext,
  mergeVaultSyncPlaintexts,
  mergeVaultSyncForServer,
  passwordAliasesToVaultSyncPlaintext,
  pruneMergedToActivePasswordAliases,
  isSameVaultSyncPlaintext,
  encryptVaultSyncBlob,
  decryptVaultSyncBlob,
  executeVaultSyncPush,
} from "./lib/vaultSyncMerge.js";
export type {
  VaultSyncPlaintext,
  VaultSyncEntryV1,
  VaultSyncPutResult,
  VaultSyncGetResponse,
  VaultSyncPutRequest,
} from "./lib/vaultSyncMerge.js";
export type {
  CallGuardCallLog,
  CallGuardDecision,
  CallGuardSummary,
} from "./types/callGuard.js";
export type {
  ScamEngagementSession,
  ScamEngagementSummary,
  ScamPersonaId,
  ScamTranscriptLine,
} from "./types/scamEngage.js";
export type {
  ExposureReport,
  ExposureReportSection,
  ExposureSeverity,
} from "./types/exposureReport.js";
export type { FamilyMember, FamilySnapshot, FamilyMemberRole } from "./types/family.js";
export type { UserAiPreferences } from "./types/userPreferences.js";
export type { AliasHealthIntel, AliasUsagePoint } from "./types/aliasIntelligence.js";
export type {
  InboxMessageCategory,
  InboxMessageClassification,
  InboxSummary,
} from "./types/inboxClassification.js";
export {
  generateCallGuardDemo,
  generateCallGuardDemoLogs,
} from "./lib/generateCallGuardDemo.js";
export {
  generateScamEngageDemo,
  generateScamEngageDemoSessions,
  SCAM_ENGAGE_PERSONA_IDS,
} from "./lib/generateScamEngageDemo.js";
export {
  THREAT_INTEL_CATALOG,
  listThreatIntelPatterns,
} from "./lib/threatIntelCatalog.js";
export {
  buildExposureReport,
  type ExposureReportInput,
} from "./lib/buildExposureReport.js";
export { computeAliasHealthScore } from "./lib/computeAliasHealthScore.js";
export { inferAliasCategory } from "./lib/inferAliasCategory.js";
export {
  classifyInboxMessage,
  type ClassifyInboxMessageInput,
  type ClassifyInboxMessageResult,
} from "./lib/classifyInboxMessage.js";
export {
  detectPasswordReuse,
  type PasswordReuseEntry,
  type PasswordReuseGroup,
} from "./lib/detectPasswordReuse.js";
export { computeBrokerExposureSeverity } from "./lib/computeBrokerExposureSeverity.js";
export {
  exposureSeverityBand,
  exposureSeverityBandLabel,
  type ExposureSeverityBand,
} from "./lib/exposureSeverityBand.js";
export {
  buildBrokerRemovalNarrative,
  type BrokerRemovalNarrative,
  type BrokerRemovalPhase,
} from "./lib/buildBrokerRemovalNarrative.js";
export {
  buildDarkWebImpactAnalysis,
  type DarkWebImpactInput,
} from "./lib/buildDarkWebImpactAnalysis.js";
export {
  parseUserAiPreferencesPatch,
  DEFAULT_USER_AI_PREFERENCES,
  type ParseUserAiPreferencesPatchResult,
} from "./lib/parseUserAiPreferences.js";
