import type { ClientResult } from "@probitas/client";
import { HttpBody } from "./body.ts";
import { HttpError, type HttpFailureError } from "./errors.ts";

/**
 * Base interface for all HTTP response types.
 *
 * Provides common properties and methods shared by Success, Error, and Failure responses.
 */
// deno-lint-ignore no-explicit-any
interface HttpResponseBase<T = any> extends ClientResult {
  /** Result kind discriminator. Always `"http"` for HTTP responses. */
  readonly kind: "http";

  /** Whether the request was processed by the server. */
  readonly processed: boolean;

  /** Whether the response was successful. */
  readonly ok: boolean;

  /** Error that occurred during the operation. */
  readonly error: Error | HttpFailureError | null;

  /** Response time in milliseconds. */
  readonly duration: number;

  /** Request URL. */
  readonly url: string;

  /** Response body as raw bytes (null if no body or failure). */
  readonly body: Uint8Array | null;

  /** Get body as ArrayBuffer (null if no body or failure). */
  readonly arrayBuffer: ArrayBuffer | null;

  /** Get body as Blob (null if no body or failure). */
  readonly blob: Blob | null;

  /**
   * Get body as text (null if no body or failure).
   */
  readonly text: string | null;

  /**
   * Get body as parsed JSON (null if no body or failure).
   * @throws SyntaxError if body is not valid JSON
   */
  readonly json: T | null;

  /** Raw Web standard Response (null for failure). */
  readonly raw: globalThis.Response | null;
}

/**
 * HTTP response for successful requests (2xx status codes).
 *
 * Wraps Web standard Response, allowing body to be read synchronously
 * and multiple times (unlike the streaming-based standard Response).
 */
// deno-lint-ignore no-explicit-any
export interface HttpResponseSuccess<T = any> extends HttpResponseBase<T> {
  /** Server processed the request. */
  readonly processed: true;

  /** Response was successful (2xx). */
  readonly ok: true;

  /** No error for successful responses. */
  readonly error: null;

  /** HTTP status code (200-299). */
  readonly status: number;

  /** HTTP status text. */
  readonly statusText: string;

  /** Response headers. */
  readonly headers: Headers;

  /** Raw Web standard Response. */
  readonly raw: globalThis.Response;
}

/**
 * HTTP response for error responses (4xx/5xx status codes).
 *
 * Server received and processed the request, but returned an error status.
 */
// deno-lint-ignore no-explicit-any
export interface HttpResponseError<T = any> extends HttpResponseBase<T> {
  /** Server processed the request. */
  readonly processed: true;

  /** Response was not successful (4xx/5xx). */
  readonly ok: false;

  /** Error describing the HTTP error. */
  readonly error: HttpError;

  /** HTTP status code (4xx/5xx). */
  readonly status: number;

  /** HTTP status text. */
  readonly statusText: string;

  /** Response headers. */
  readonly headers: Headers;

  /** Raw Web standard Response. */
  readonly raw: globalThis.Response;
}

/**
 * HTTP response for request failures (network errors, timeouts, etc.).
 *
 * Request could not be processed by the server (network error, DNS failure,
 * connection refused, timeout, aborted, etc.).
 */
// deno-lint-ignore no-explicit-any
export interface HttpResponseFailure<T = any> extends HttpResponseBase<T> {
  /** Server did not process the request. */
  readonly processed: false;

  /** Request failed. */
  readonly ok: false;

  /** Error describing the failure (ConnectionError, TimeoutError, AbortError). */
  readonly error: HttpFailureError;

  /** No HTTP status (request didn't reach server). */
  readonly status: null;

  /** No HTTP status text (request didn't reach server). */
  readonly statusText: null;

  /** No headers (request didn't reach server). */
  readonly headers: null;

  /** No body (request didn't reach server). */
  readonly body: null;

  /** No raw response (request didn't reach server). */
  readonly raw: null;
}

/**
 * HTTP response union type representing all possible response states.
 *
 * - **Success (2xx)**: `processed: true, ok: true, error: null`
 * - **Error (4xx/5xx)**: `processed: true, ok: false, error: HttpError`
 * - **Failure (network error)**: `processed: false, ok: false, error: Error`
 *
 * @example Type narrowing by ok
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * await using http = createHttpClient({ url: "http://localhost:3000" });
 * const response = await http.get("/users");
 * if (response.ok) {
 *   // TypeScript knows: HttpResponseSuccess
 *   console.log(response.status); // number
 * } else {
 *   // TypeScript knows: HttpResponseError | HttpResponseFailure
 *   console.log(response.error); // Error
 * }
 * ```
 *
 * @example Type narrowing by processed
 * ```ts
 * import { createHttpClient } from "@probitas/client-http";
 *
 * await using http = createHttpClient({ url: "http://localhost:3000" });
 * const response = await http.get("/users");
 * if (response.processed) {
 *   // TypeScript knows: HttpResponseSuccess | HttpResponseError
 *   console.log(response.status); // number
 * } else {
 *   // TypeScript knows: HttpResponseFailure
 *   console.log(response.error); // Error (network error)
 * }
 * ```
 */
// deno-lint-ignore no-explicit-any
export type HttpResponse<T = any> =
  | HttpResponseSuccess<T>
  | HttpResponseError<T>
  | HttpResponseFailure<T>;

/**
 * Implementation of HttpResponseSuccess.
 * @internal
 */
// deno-lint-ignore no-explicit-any
export class HttpResponseSuccessImpl<T = any>
  implements HttpResponseSuccess<T> {
  readonly kind = "http" as const;
  readonly processed = true as const;
  readonly ok = true as const;
  readonly error = null;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  readonly duration: number;

  readonly #raw: globalThis.Response;
  readonly #body: HttpBody;

  constructor(
    raw: globalThis.Response,
    body: Uint8Array | null,
    duration: number,
  ) {
    this.status = raw.status;
    this.statusText = raw.statusText;
    this.headers = raw.headers;
    this.url = raw.url;
    this.duration = duration;
    this.#raw = raw;
    this.#body = new HttpBody(body, raw.headers);
  }

  get body(): Uint8Array | null {
    return this.#body.bytes;
  }

  get arrayBuffer(): ArrayBuffer | null {
    return this.#body.arrayBuffer;
  }

  get blob(): Blob | null {
    return this.#body.blob;
  }

  get text(): string | null {
    return this.#body.text;
  }

  get json(): T | null {
    return this.#body.json as T | null;
  }

  get raw(): globalThis.Response {
    return this.#raw;
  }
}

/**
 * Implementation of HttpResponseError.
 * Proxies body methods to the HttpError instance.
 * @internal
 */
// deno-lint-ignore no-explicit-any
export class HttpResponseErrorImpl<T = any> implements HttpResponseError<T> {
  readonly kind = "http" as const;
  readonly processed = true as const;
  readonly ok = false as const;
  readonly error: HttpError;
  readonly status: number;
  readonly statusText: string;
  readonly headers: Headers;
  readonly url: string;
  readonly duration: number;

  readonly #raw: globalThis.Response;

  constructor(
    raw: globalThis.Response,
    duration: number,
    error: HttpError,
  ) {
    this.error = error;
    this.status = raw.status;
    this.statusText = raw.statusText;
    this.headers = raw.headers;
    this.url = raw.url;
    this.duration = duration;
    this.#raw = raw;
  }

  // Proxy body access to error
  get body(): Uint8Array | null {
    return this.error.body;
  }

  get arrayBuffer(): ArrayBuffer | null {
    return this.error.arrayBuffer;
  }

  get blob(): Blob | null {
    return this.error.blob;
  }

  get text(): string | null {
    return this.error.text;
  }

  get json(): T | null {
    return this.error.json as T | null;
  }

  get raw(): globalThis.Response {
    return this.#raw;
  }
}

/**
 * Implementation of HttpResponseFailure.
 * @internal
 */
// deno-lint-ignore no-explicit-any
export class HttpResponseFailureImpl<T = any>
  implements HttpResponseFailure<T> {
  readonly kind = "http" as const;
  readonly processed = false as const;
  readonly ok = false as const;
  readonly error: HttpFailureError;
  readonly status = null;
  readonly statusText = null;
  readonly headers = null;
  readonly url: string;
  readonly body = null;
  readonly duration: number;

  readonly arrayBuffer = null;
  readonly blob = null;
  readonly text = null;
  readonly json = null;
  readonly raw = null;

  constructor(url: string, duration: number, error: HttpFailureError) {
    this.url = url;
    this.duration = duration;
    this.error = error;
  }
}
