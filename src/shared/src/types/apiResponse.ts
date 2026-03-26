/**
 * Standard JSON envelope for Phantom HTTP APIs: `{ ok: true, data }` or
 * `{ ok: false, error }`. Rename fields only with coordinated API + clients + docs.
 */
export interface ApiSuccess<T> {
  ok: true;
  data: T;
}

export interface ApiErrorBody {
  code: string;
  message: string;
  /** Present on some 429 responses (e.g. broker scan cap) — seconds until retry. */
  retryAfterSeconds?: number;
  /** Present on 403 `tier_limit` when alias create is blocked for free tier. */
  tierLimit?: {
    aliasType: string;
    used: number;
    max: number;
  };
  /**
   * Set by dashboard/extension `parseApiResponseJson` from the HTTP response
   * (not part of server JSON). Used for consistent client-side error mapping.
   */
  httpStatus?: number;
}

export interface ApiFailure {
  ok: false;
  error: ApiErrorBody;
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;
