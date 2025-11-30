/**
 * @probitas/client-http - HTTP client for Probitas scenario testing framework.
 *
 * @example
 * ```ts
 * import { createHttpClient, expectHttpResponse } from "@probitas/client-http";
 *
 * const http = createHttpClient({ baseUrl: "http://localhost:3000" });
 *
 * const res = await http.get("/users/123");
 * expectHttpResponse(res)
 *   .ok()
 *   .contentType("application/json")
 *   .jsonContains({ name: "John" });
 *
 * const user = res.json<User>();
 *
 * await http.close();
 * ```
 *
 * @module
 */

// Types (type-only exports for tree-shaking)
export type {
  BodyInit,
  HttpClient,
  HttpClientConfig,
  HttpOptions,
  HttpResponse,
  QueryValue,
} from "./types.ts";

// Errors
export {
  HttpBadRequestError,
  HttpConflictError,
  HttpError,
  type HttpErrorOptions,
  HttpForbiddenError,
  HttpInternalServerError,
  HttpNotFoundError,
  HttpTooManyRequestsError,
  HttpUnauthorizedError,
} from "./errors.ts";

// Client
export { createHttpClient } from "./client.ts";

// Response (internal, but exported for testing/advanced use)
export { createHttpResponse } from "./response.ts";

// Expectations
export { expectHttpResponse, type HttpResponseExpectation } from "./expect.ts";
