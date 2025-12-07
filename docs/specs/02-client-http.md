# @probitas/client-http

HTTP client package.

## HttpResponse

```typescript
/**
 * HTTP response wrapper
 *
 * Wraps the Web standard Response, buffers the body, and allows sync access.
 */
interface HttpResponse {
  // --- Web-standard compatible properties ---

  /** Whether the response is successful (status 200-299) */
  readonly ok: boolean;

  /** HTTP status code */
  readonly status: number;

  /** HTTP status text */
  readonly statusText: string;

  /** Response headers */
  readonly headers: Headers;

  /** Request URL */
  readonly url: string;

  // --- Body access (sync, repeatable, null when no body) ---

  /** Response body (raw bytes, or null) */
  readonly body: Uint8Array | null;

  /** Get body as ArrayBuffer (or null) */
  arrayBuffer(): ArrayBuffer | null;

  /** Get body as Blob (or null) */
  blob(): Blob | null;

  /** Get body as text (or null) */
  text(): string | null;

  /**
   * Parse body as JSON.
   * - Returns null when there is no body
   * - Throws SyntaxError on parse failure
   * @template T - defaults to any for test ergonomics
   */
  json<T = any>(): T | null;

  // --- Extra properties ---

  /** Response time in milliseconds */
  readonly duration: number;

  /** Original Web Response (for streaming or special cases) */
  readonly raw: globalThis.Response;
}
```

## HttpError

```typescript
/**
 * HTTP error (extends ClientError)
 */
class HttpError extends ClientError {
  /** HTTP status code */
  readonly status: number;

  /** HTTP status text */
  readonly statusText: string;

  /** Response, if available */
  readonly response?: HttpResponse;
}

// Specific errors
class HttpBadRequestError extends HttpError {
  readonly status = 400;
}
class HttpUnauthorizedError extends HttpError {
  readonly status = 401;
}
class HttpForbiddenError extends HttpError {
  readonly status = 403;
}
class HttpNotFoundError extends HttpError {
  readonly status = 404;
}
class HttpConflictError extends HttpError {
  readonly status = 409;
}
class HttpTooManyRequestsError extends HttpError {
  readonly status = 429;
}
class HttpInternalServerError extends HttpError {
  readonly status = 500;
}
```

## expectHttpResponse

```typescript
interface HttpResponseExpectation {
  // --- Status checks ---
  ok(): this;
  notOk(): this;
  status(code: number): this;
  statusInRange(min: number, max: number): this;

  // --- Header checks ---
  header(name: string, expected: string | RegExp): this;
  headerExists(name: string): this;
  contentType(expected: string | RegExp): this;

  // --- Body checks (Uint8Array) ---
  noContent(): this;
  hasContent(): this;
  bodyContains(subbody: Uint8Array): this;
  bodyMatch(matcher: (body: Uint8Array) => void): this;

  // --- Body checks (text) ---
  textContains(substring: string): this;
  textMatch(matcher: (text: string) => void): this;

  // --- Body checks (JSON) ---
  dataContains<T = any>(subset: Partial<T>): this;
  dataMatch<T = any>(matcher: (body: T) => void): this;

  // --- Performance ---
  durationLessThan(ms: number): this;
}

function expectHttpResponse(response: HttpResponse): HttpResponseExpectation;
```

## HttpClient

```typescript
/**
 * Cookie configuration
 */
interface CookieConfig {
  /**
   * Disable automatic cookie handling.
   * When disabled, cookies are neither stored nor sent.
   * @default false
   */
  readonly disabled?: boolean;

  /** Initial cookies */
  readonly initial?: Record<string, string>;
}

/**
 * HTTP connection configuration object.
 */
interface HttpConnectionConfig {
  /** Host name or IP address */
  readonly host: string;

  /** Port number */
  readonly port?: number;

  /** Protocol ("http" or "https") */
  readonly protocol?: "http" | "https";

  /** Base path (e.g., "/api/v1") */
  readonly basePath?: string;
}

interface HttpClientConfig extends CommonOptions {
  /** Server URL (string or config object) */
  readonly url: string | HttpConnectionConfig;
  readonly headers?: Record<string, string>;
  readonly fetch?: typeof fetch;

  /**
   * Redirect handling mode
   * - "follow": follow redirects automatically (default)
   * - "manual": return redirect response as-is
   * - "error": throw on redirect
   * @default "follow"
   */
  readonly redirect?: RedirectMode;

  /**
   * Throw HttpError on non-2xx responses.
   * Can be overridden per request via HttpOptions.throwOnError.
   * @default true
   */
  readonly throwOnError?: boolean;

  /**
   * Cookie settings.
   * By default a cookie jar is maintained and managed automatically between requests.
   * Disable via `cookies: { disabled: true }`.
   */
  readonly cookies?: CookieConfig;
}

type RedirectMode = "follow" | "manual" | "error";

interface HttpClient extends AsyncDisposable {
  readonly config: HttpClientConfig;

  get(path: string, options?: HttpOptions): Promise<HttpResponse>;
  post(
    path: string,
    body?: BodyInit,
    options?: HttpOptions,
  ): Promise<HttpResponse>;
  put(
    path: string,
    body?: BodyInit,
    options?: HttpOptions,
  ): Promise<HttpResponse>;
  patch(
    path: string,
    body?: BodyInit,
    options?: HttpOptions,
  ): Promise<HttpResponse>;
  delete(path: string, options?: HttpOptions): Promise<HttpResponse>;
  request(
    method: string,
    path: string,
    options?: HttpOptions & { body?: BodyInit },
  ): Promise<HttpResponse>;

  /**
   * Get all cookies in the jar.
   * Returns an empty object when cookies are disabled.
   */
  getCookies(): Record<string, string>;

  /**
   * Set a cookie into the jar.
   * @throws when cookies are disabled.
   */
  setCookie(name: string, value: string): void;

  /**
   * Clear all cookies from the jar.
   * Does nothing when cookies are disabled.
   */
  clearCookies(): void;

  close(): Promise<void>;
}

/** Query parameter value type */
type QueryValue = string | number | boolean;

interface HttpOptions extends CommonOptions {
  readonly query?: Record<string, QueryValue | QueryValue[]>;
  readonly headers?: Record<string, string>;

  /**
   * Redirect handling mode (overrides HttpClientConfig.redirect).
   * @default "follow" (when not set in client config)
   */
  readonly redirect?: RedirectMode;

  /**
   * Throw HttpError on non-2xx responses (overrides HttpClientConfig.throwOnError).
   * @default true (when not set in client config)
   */
  readonly throwOnError?: boolean;
}

type BodyInit =
  | string
  | Uint8Array
  | Record<string, unknown>
  | FormData
  | URLSearchParams;

function createHttpClient(config: HttpClientConfig): HttpClient;
```

## Examples

```typescript
import { createHttpClient, expectHttpResponse } from "@probitas/client-http";

const http = createHttpClient({ url: "http://localhost:3000" });

// GET - synchronous, repeatable body access
const res = await http.get("/users/123");
const user = res.json<User>();
const text = res.text();
const bytes = res.body;

// POST with expectations
const res2 = await http.post("/users", {
  name: "John",
  email: "john@example.com",
});
expectHttpResponse(res2)
  .ok()
  .status(201)
  .contentType("application/json")
  .dataContains({ name: "John" })
  .dataMatch<User>((user) => {
    if (!user.id) throw new Error("Missing id");
  });
const created = res2.json<User>();

// Access headers
const contentType = res.headers.get("content-type");

// Use raw response when needed (e.g., streaming)
const rawResponse: globalThis.Response = res.raw;

// throwOnError: false to inspect error responses
const res3 = await http.get("/not-found", { throwOnError: false });
expectHttpResponse(res3).notOk().status(404);

// Disable throwing at the client level
const httpNoThrow = createHttpClient({
  url: "http://localhost:3000",
  throwOnError: false,
});
const res4 = await httpNoThrow.get("/error"); // no exception
if (!res4.ok) {
  console.log(`Error: ${res4.status}`);
}

// Automatic cookie management (enabled by default)
const http2 = createHttpClient({
  url: "http://localhost:3000",
  cookies: { initial: { session: "initial-token" } },
});

// Cookies are sent automatically; Set-Cookie responses are stored
await http2.post("/login", { user: "john", pass: "secret" });

// Inspect stored cookies
const cookies = http2.getCookies();
console.log(cookies);

// Manually set and clear cookies
http2.setCookie("custom", "value");
http2.clearCookies();

// Disable cookies entirely
const httpNoCookies = createHttpClient({
  url: "http://localhost:3000",
  cookies: { disabled: true },
});

// Using connection config object
const httpWithConfig = createHttpClient({
  url: { host: "localhost", port: 3000, protocol: "http" },
});
```
