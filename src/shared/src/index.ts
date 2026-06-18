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
export {
  adjustPhishingScoreForSensitivity,
  resolvePhishingQuarantineThreshold,
  scoreInboxPhishingWithSensitivity,
} from "./lib/aiSensitivityPhishing.js";
export {
  rankBrokersForRemoval,
  type BrokerRemovalPriorityItem,
} from "./lib/rankBrokersForRemoval.js";
export { formatPrivacyDigestEmail } from "./lib/formatPrivacyDigestEmail.js";
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
  CopilotGenerateAliasParams,
} from "./types/copilotTools.js";
export { isCopilotGenerateAliasParams } from "./types/copilotTools.js";
export { detectCopilotToolIntent } from "./lib/detectCopilotToolIntent.js";
export { inferCopilotGenerateAlias } from "./lib/inferCopilotGenerateAlias.js";
export { matchSiteThreatPatterns } from "./lib/matchSiteThreatPatterns.js";
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
export type { BillingValueSummary } from "./types/billingValue.js";
export type { BreachTimelinePoint } from "./types/breachTimeline.js";
export type {
  AliasRelationshipEdge,
  AliasRelationshipMap,
  AliasRelationshipNode,
} from "./types/aliasRelationship.js";
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
  CallGuardSummary,
  CallGuardDecision,
} from "./types/callGuard.js";
export type { CallGuardActiveSession } from "./types/callGuardActive.js";
export type { CallGuardLiveEvent, CallGuardLivePhase } from "./types/callGuardLive.js";
export type {
  AliasRotationCandidate,
  AliasRotationCandidatesSummary,
} from "./types/aliasRotation.js";
export type { PrivacyDigest } from "./types/privacyDigest.js";
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
export { generateActiveCallGuardSession } from "./lib/generateActiveCallGuardSession.js";
export { simulateCallGuardLiveEvents } from "./lib/simulateCallGuardLive.js";
export {
  rankAliasesForRotation,
  formatRotationCandidatesReply,
  type AliasRotationInput,
} from "./lib/rankAliasesForRotation.js";
export {
  buildPrivacyDigest,
  type PrivacyDigestInput,
} from "./lib/buildPrivacyDigest.js";
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
export {
  rankVaultPasswordsForRotation,
  type VaultPasswordRotationCandidate,
  type VaultPasswordRotationInput,
} from "./lib/rankVaultPasswordsForRotation.js";
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
export { buildBreachTimeline } from "./lib/buildBreachTimeline.js";
export {
  buildAliasRelationshipMap,
  type AliasRelationshipInput,
} from "./lib/buildAliasRelationshipMap.js";
export {
  buildBillingValueSummary,
  type BillingValueInput,
} from "./lib/buildBillingValueSummary.js";
export {
  buildLiveSystemLayerStatus,
  type LiveSystemLayerInput,
} from "./lib/buildLiveSystemLayerStatus.js";
export {
  pickAliasForSite,
  type AliasSiteMatchCandidate,
} from "./lib/pickAliasForSite.js";
export {
  parseUserAiPreferencesPatch,
  DEFAULT_USER_AI_PREFERENCES,
  type ParseUserAiPreferencesPatchResult,
} from "./lib/parseUserAiPreferences.js";
