import type { UserAiPreferences } from "@phantom/shared";
import { DEFAULT_USER_AI_PREFERENCES } from "@phantom/shared";

export type UserAiPreferencesRow = {
  autopilotAutoRotate: boolean;
  autopilotAutoQuarantine: boolean;
  autopilotAutoComplaint: boolean;
  aiSensitivity: number;
  notificationDigestMode: boolean;
};

export function mapUserPreferences(
  row: Partial<UserAiPreferencesRow> | null | undefined
): UserAiPreferences {
  if (!row) return { ...DEFAULT_USER_AI_PREFERENCES };

  return {
    autopilotAutoRotate:
      row.autopilotAutoRotate ?? DEFAULT_USER_AI_PREFERENCES.autopilotAutoRotate,
    autopilotAutoQuarantine:
      row.autopilotAutoQuarantine ??
      DEFAULT_USER_AI_PREFERENCES.autopilotAutoQuarantine,
    autopilotAutoComplaint:
      row.autopilotAutoComplaint ??
      DEFAULT_USER_AI_PREFERENCES.autopilotAutoComplaint,
    aiSensitivity: row.aiSensitivity ?? DEFAULT_USER_AI_PREFERENCES.aiSensitivity,
    notificationDigestMode:
      row.notificationDigestMode ??
      DEFAULT_USER_AI_PREFERENCES.notificationDigestMode,
  };
}

export const USER_AI_PREFERENCES_SELECT = {
  autopilotAutoRotate: true,
  autopilotAutoQuarantine: true,
  autopilotAutoComplaint: true,
  aiSensitivity: true,
  notificationDigestMode: true,
} as const;
