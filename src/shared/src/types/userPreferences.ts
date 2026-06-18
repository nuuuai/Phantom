export interface UserAiPreferences {
  autopilotAutoRotate: boolean;
  autopilotAutoQuarantine: boolean;
  autopilotAutoComplaint: boolean;
  autopilotAutoRemoval: boolean;
  /** 0 = conservative, 100 = aggressive */
  aiSensitivity: number;
  notificationDigestMode: boolean;
}
