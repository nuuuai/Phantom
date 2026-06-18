import type { UserAiPreferences } from "../types/userPreferences.js";

export type ParseUserAiPreferencesPatchResult =
  | { ok: true; patch: Partial<UserAiPreferences> }
  | { ok: false; message: string };

function isBool(v: unknown): v is boolean {
  return typeof v === "boolean";
}

function parseSensitivity(v: unknown): number | undefined {
  if (typeof v !== "number" || !Number.isFinite(v)) return undefined;
  return Math.min(100, Math.max(0, Math.round(v)));
}

export function parseUserAiPreferencesPatch(
  body: unknown
): ParseUserAiPreferencesPatchResult {
  if (body === null || typeof body !== "object" || Array.isArray(body)) {
    return { ok: false, message: "Body must be a JSON object" };
  }

  const src = body as Record<string, unknown>;
  const patch: Partial<UserAiPreferences> = {};

  if ("autopilotAutoRotate" in src) {
    if (!isBool(src.autopilotAutoRotate)) {
      return { ok: false, message: "autopilotAutoRotate must be a boolean" };
    }
    patch.autopilotAutoRotate = src.autopilotAutoRotate;
  }
  if ("autopilotAutoQuarantine" in src) {
    if (!isBool(src.autopilotAutoQuarantine)) {
      return { ok: false, message: "autopilotAutoQuarantine must be a boolean" };
    }
    patch.autopilotAutoQuarantine = src.autopilotAutoQuarantine;
  }
  if ("autopilotAutoComplaint" in src) {
    if (!isBool(src.autopilotAutoComplaint)) {
      return { ok: false, message: "autopilotAutoComplaint must be a boolean" };
    }
    patch.autopilotAutoComplaint = src.autopilotAutoComplaint;
  }
  if ("notificationDigestMode" in src) {
    if (!isBool(src.notificationDigestMode)) {
      return { ok: false, message: "notificationDigestMode must be a boolean" };
    }
    patch.notificationDigestMode = src.notificationDigestMode;
  }
  if ("aiSensitivity" in src) {
    const sens = parseSensitivity(src.aiSensitivity);
    if (sens === undefined) {
      return { ok: false, message: "aiSensitivity must be a number 0–100" };
    }
    patch.aiSensitivity = sens;
  }

  if (Object.keys(patch).length === 0) {
    return { ok: false, message: "No valid preference fields in body" };
  }

  return { ok: true, patch };
}

export const DEFAULT_USER_AI_PREFERENCES: UserAiPreferences = {
  autopilotAutoRotate: false,
  autopilotAutoQuarantine: false,
  autopilotAutoComplaint: false,
  aiSensitivity: 50,
  notificationDigestMode: false,
};
