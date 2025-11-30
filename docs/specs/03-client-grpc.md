# @probitas/client-grpc

gRPC client package.

## GrpcResponse

```typescript
/**
 * gRPC response
 */
interface GrpcResponse {
  /** Whether the call succeeded (code === 0) */
  readonly ok: boolean;

  /** gRPC status code */
  readonly code: GrpcStatusCode;

  /** Status message */
  readonly message: string;

  /** Response body (protobuf bytes, or null) */
  readonly body: Uint8Array | null;

  /** Trailing metadata */
  readonly trailers: Record<string, string>;

  /** Response time in milliseconds */
  readonly duration: number;

  /**
   * Deserialize data (or null).
   *
   * Requires schema (reflection / .proto / FileDescriptorSet). Without schema
   * this throws:
   *
   * "Cannot deserialize gRPC response: no schema available.
   *  Configure schema in GrpcClientConfig:
   *  - Use server reflection (default, requires reflection-enabled server)
   *  - Provide .proto file path: schema: './path/to/service.proto'
   *  - Provide FileDescriptorSet: schema: await Deno.readFile('descriptor.pb')
   *  Or use json() for JSON-encoded responses."
   */
  data<T = any>(): T | null;

  /**
   * Parse as JSON (or null).
   * Does not require schema.
   */
  json<T = any>(): T | null;
}

/** gRPC status codes */
type GrpcStatusCode =
  | 0 // OK
  | 1 // CANCELLED
  | 2 // UNKNOWN
  | 3 // INVALID_ARGUMENT
  | 4 // DEADLINE_EXCEEDED
  | 5 // NOT_FOUND
  | 6 // ALREADY_EXISTS
  | 7 // PERMISSION_DENIED
  | 8 // RESOURCE_EXHAUSTED
  | 9 // FAILED_PRECONDITION
  | 10 // ABORTED
  | 11 // OUT_OF_RANGE
  | 12 // UNIMPLEMENTED
  | 13 // INTERNAL
  | 14 // UNAVAILABLE
  | 15 // DATA_LOSS
  | 16; // UNAUTHENTICATED
```

## GrpcError

```typescript
/**
 * Error detail (google.rpc.Status.details)
 *
 * Parsed from the `grpc-status-details-bin` trailer.
 * Supported detail types:
 * - google.rpc.BadRequest: field validation errors
 * - google.rpc.DebugInfo: stack traces and debugging info
 * - google.rpc.RetryInfo: retry hints
 * - google.rpc.QuotaFailure: quota violations
 * - Unknown types: kept as Uint8Array
 */
interface ErrorDetail {
  /** Type URL (e.g., "type.googleapis.com/google.rpc.BadRequest") */
  readonly typeUrl: string;

  /**
   * Decoded value.
   * Known types are converted to objects:
   * - BadRequest: { fieldViolations: Array<{ field: string; description: string }> }
   * - DebugInfo: { stackEntries: string[]; detail: string }
   * - RetryInfo: { retryDelay: { seconds: number; nanos: number } | null }
   * - QuotaFailure: { violations: Array<{ subject: string; description: string }> }
   * - Unknown: Uint8Array
   */
  readonly value: unknown;
}

class GrpcError extends ClientError {
  readonly code: GrpcStatusCode;
  readonly grpcMessage: string;
  readonly metadata?: Record<string, string>;

  /**
   * Array of decoded error details.
   * Empty when no `grpc-status-details-bin` trailer is present.
   */
  readonly details: readonly ErrorDetail[];
}

class GrpcUnauthenticatedError extends GrpcError {
  readonly code = 16;
}
class GrpcPermissionDeniedError extends GrpcError {
  readonly code = 7;
}
class GrpcNotFoundError extends GrpcError {
  readonly code = 5;
}
class GrpcResourceExhaustedError extends GrpcError {
  readonly code = 8;
}
class GrpcInternalError extends GrpcError {
  readonly code = 13;
}
class GrpcUnavailableError extends GrpcError {
  readonly code = 14;
}
```

## expectGrpcResponse

```typescript
interface GrpcResponseExpectation {
  // --- Status checks ---
  ok(): this;
  notOk(): this;
  code(code: GrpcStatusCode): this;
  codeIn(...codes: GrpcStatusCode[]): this;

  // --- Message checks ---
  message(expected: string | RegExp): this;
  messageContains(substring: string): this;
  messageMatch(matcher: (message: string) => void): this;

  // --- Trailer checks ---
  trailers(key: string, expected: string | RegExp): this;
  trailersExist(key: string): this;

  // --- Body checks (Uint8Array) ---
  noContent(): this;
  hasContent(): this;
  bodyContains(subbody: Uint8Array): this;
  bodyMatch(matcher: (body: Uint8Array) => void): this;

  // --- Data checks (data) ---
  dataContains<T = any>(subset: Partial<T>): this;
  dataMatch<T = any>(matcher: (data: T) => void): this;

  // --- JSON checks ---
  jsonContains<T = any>(subset: Partial<T>): this;
  jsonMatch<T = any>(matcher: (body: T) => void): this;

  // --- Performance ---
  durationLessThan(ms: number): this;
}

function expectGrpcResponse(response: GrpcResponse): GrpcResponseExpectation;
```

## GrpcClient

```typescript
interface GrpcClientConfig extends CommonOptions {
  readonly address: string;
  readonly tls?: TlsConfig;
  readonly metadata?: Record<string, string>;

  /**
   * Schema resolution settings:
   * - "reflection": use server reflection (default)
   * - string/string[]: .proto file path(s)
   * - Uint8Array: FileDescriptorSet binary
   *
   * With "reflection", schemas are fetched automatically on connect.
   * If that fails, data() will throw when called.
   */
  readonly schema?: "reflection" | string | string[] | Uint8Array;

  /**
   * Throw GrpcError on non-OK responses (code !== 0).
   * Overridable per request via GrpcOptions.throwOnError.
   * @default true
   */
  readonly throwOnError?: boolean;
}

interface GrpcClient<TService = unknown> extends AsyncDisposable {
  readonly config: GrpcClientConfig;

  call(
    method: keyof TService & string,
    request: Uint8Array,
    options?: GrpcOptions,
  ): Promise<GrpcResponse>;
  serverStream(
    method: keyof TService & string,
    request: Uint8Array,
    options?: GrpcOptions,
  ): AsyncIterable<GrpcResponse>;
  clientStream(
    method: keyof TService & string,
    requests: AsyncIterable<Uint8Array>,
    options?: GrpcOptions,
  ): Promise<GrpcResponse>;
  bidiStream(
    method: keyof TService & string,
    requests: AsyncIterable<Uint8Array>,
    options?: GrpcOptions,
  ): AsyncIterable<GrpcResponse>;

  close(): Promise<void>;
}

interface GrpcOptions extends CommonOptions {
  readonly metadata?: Record<string, string>;

  /**
   * Throw GrpcError on non-OK responses (code !== 0).
   * Overrides GrpcClientConfig.throwOnError.
   * @default true (when client config leaves it unset)
   */
  readonly throwOnError?: boolean;
}

function createGrpcClient<TService>(
  config: GrpcClientConfig,
): GrpcClient<TService>;
```

## Examples

```typescript
import {
  createGrpcClient,
  expectGrpcResponse,
  GrpcError,
} from "@probitas/client-grpc";

const grpc = await createGrpcClient({
  address: "localhost:50051",
  schema: "./proto/service.proto",
});

// Unary call
const res = await grpc.call("example.v1.Service/GetUser", { id: "123" });
expectGrpcResponse(res)
  .ok()
  .hasContent()
  .jsonContains({ name: "John" });

// Validate trailing metadata
const res2 = await grpc.call("example.v1.Service/GetWithTrailers", {
  id: "456",
});
expectGrpcResponse(res2)
  .ok()
  .trailersExist("x-request-id")
  .trailers("x-request-id", /^req-/);

// Parse Rich Error Model details
try {
  await grpc.call("example.v1.Service/ValidateUser", {
    email: "invalid",
    age: -1,
  });
} catch (error) {
  if (error instanceof GrpcError) {
    console.log(error.code); // 3 (INVALID_ARGUMENT)
    console.log(error.grpcMessage); // "Validation failed"

    for (const detail of error.details) {
      if (detail.typeUrl.includes("BadRequest")) {
        const badRequest = detail.value as {
          fieldViolations: Array<{ field: string; description: string }>;
        };
        for (const violation of badRequest.fieldViolations) {
          console.log(`${violation.field}: ${violation.description}`);
        }
      }
    }
  }
}

// Server streaming
for await (const res of grpc.serverStream("example.v1.Service/ListUsers", {})) {
  expectGrpcResponse(res).ok();
  const user = res.json<User>();
  console.log(user);
}

await grpc.close();
```
