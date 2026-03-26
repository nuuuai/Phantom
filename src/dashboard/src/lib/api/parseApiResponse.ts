import type { ApiResponse } from "@phantom/shared";

function isJsonContentType(contentType: string): boolean {
  return /application\/json|\+json/i.test(contentType);
}

function invalidResponse(message: string, httpStatus: number): ApiResponse<never> {
  return {
    ok: false,
    error: { code: "invalid_response", message, httpStatus },
  };
}

function logDevFailure(response: Response): void {
  try {
    if (import.meta.env.DEV && !response.ok) {
      const rid = response.headers.get("x-request-id");
      if (rid) console.warn("[phantom-api]", response.status, rid);
    }
  } catch {
    /* ignore */
  }
}

/** Normalizes JSON bodies from `fetch` into `ApiResponse<T>` including non-2xx HTTP. */
export async function parseApiResponseJson<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    logDevFailure(response);
    return invalidResponse(
      response.ok
        ? "Empty response body"
        : `HTTP ${String(response.status)} with empty body`,
      response.status
    );
  }

  if (!isJsonContentType(contentType)) {
    logDevFailure(response);
    return invalidResponse(
      `Expected JSON response but received ${contentType || "unknown content type"}`,
      response.status
    );
  }

  let data: ApiResponse<T>;
  try {
    data = JSON.parse(trimmed) as ApiResponse<T>;
  } catch {
    logDevFailure(response);
    return invalidResponse("Response is not valid JSON", response.status);
  }

  if (!response.ok) {
    logDevFailure(response);
    if (data.ok === false) {
      return {
        ...data,
        error: { ...data.error, httpStatus: response.status },
      };
    }
    return {
      ok: false,
      error: {
        code: "http_error",
        message: `HTTP ${String(response.status)}`,
        httpStatus: response.status,
      },
    };
  }
  return data;
}
