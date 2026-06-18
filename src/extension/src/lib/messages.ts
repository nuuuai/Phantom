export const MESSAGE_GENERATE_ALIAS = "phantom:generate-alias" as const;
export const MESSAGE_FIELD_SCAN = "phantom:field-scan" as const;
export const MESSAGE_LOGIN = "phantom:login" as const;
export const MESSAGE_LOGOUT = "phantom:logout" as const;
export const MESSAGE_FILL_ALIAS = "phantom:fill-alias" as const;
export const MESSAGE_COPILOT_CHAT = "phantom:copilot-chat" as const;
export const MESSAGE_COPILOT_CONFIRM = "phantom:copilot-confirm" as const;

export type FieldKind = "email" | "password" | "username";

export type BackgroundMessage =
  | {
      type: typeof MESSAGE_GENERATE_ALIAS;
      fieldKind?: FieldKind;
      siteHostname?: string;
    }
  | {
      type: typeof MESSAGE_FIELD_SCAN;
      emailFields: number;
      passwordFields: number;
    }
  | { type: typeof MESSAGE_LOGIN; email: string; password: string }
  | { type: typeof MESSAGE_LOGOUT }
  | { type: typeof MESSAGE_FILL_ALIAS; fieldId: string; value: string }
  | { type: typeof MESSAGE_COPILOT_CHAT; message: string }
  | {
      type: typeof MESSAGE_COPILOT_CONFIRM;
      toolId: string;
      params?: Record<string, unknown>;
    };
