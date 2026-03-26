export const MESSAGE_GENERATE_ALIAS = "phantom:generate-alias" as const;
export const MESSAGE_FIELD_SCAN = "phantom:field-scan" as const;
export const MESSAGE_LOGIN = "phantom:login" as const;

export type BackgroundMessage =
  | { type: typeof MESSAGE_GENERATE_ALIAS }
  | {
      type: typeof MESSAGE_FIELD_SCAN;
      emailFields: number;
      passwordFields: number;
    }
  | { type: typeof MESSAGE_LOGIN; email: string; password: string };
