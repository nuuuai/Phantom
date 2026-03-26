import type { ApiResponse } from "@phantom/shared";

function isJsonContentType(contentType: string): boolean {
  return /application\/json|\+json/i.test(contentType);
}

function invalidResponse(message: string): ApiResponse<never> {
  return {
    ok: false,
    error: { code: "invalid_response", message },
  };
}

/** Normalizes JSON bodies from `fetch` into `ApiResponse<T>` including non-2xx HTTP. */
export async function parseApiResponseJson<T>(
  response: Response
): Promise<ApiResponse<T>> {
  const contentType = response.headers.get("content-type") ?? "";
  const text = await response.text();
  const trimmed = text.trim();

  if (trimmed.length === 0) {
    return invalidResponse(
      response.ok
        ? "Empty response body"
        : `HTTP ${String(response.status)} with empty body`
    );
  }

  if (!isJsonContentType(contentType)) {
    return invalidResponse(
      `Expected JSON response but received ${contentType || "unknown content type"}`
    );
  }

  let data: ApiResponse<T>;
  try {
    data = JSON.parse(trimmed) as ApiResponse<T>;
  } catch {
    return invalidResponse("Response is not valid JSON");
  }

  if (!response.ok) {
    if (data.ok === false) {
      return data;
    }
    return {
      ok: false,
      error: {
        code: "http_error",
        message: `HTTP ${String(response.status)}`,
      },
    };
  }
  return data;
}
