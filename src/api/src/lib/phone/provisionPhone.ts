/**
 * Phone provisioning — re-exports provider-agnostic adapter (see `phoneAdapter.ts`).
 */
export {
  provisionPhoneAlias,
  type PhoneProvisionResult,
  type PhoneProvisionSuccess,
  type PhoneProvisionFailure,
} from "./phoneAdapter.js";
export {
  getPhoneAdapterId,
  getPhoneProviderMode,
  getPhoneProviderPublicStatus,
  getTwilioAccountSid,
  isTwilioConfigured,
  type PhoneAdapterId,
} from "./phoneConfig.js";
