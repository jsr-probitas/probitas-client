# @probitas/client

Core package that provides common options and the base error hierarchy.

## CommonOptions

```typescript
interface CommonOptions {
  /** Timeout in milliseconds */
  readonly timeout?: number;

  /** AbortSignal */
  readonly signal?: AbortSignal;

  /** Retry configuration */
  readonly retry?: RetryOptions;
}

interface RetryOptions {
  /** Max attempts (1 = no retries, default: 1) */
  readonly maxAttempts?: number;

  /** Backoff strategy (default: "exponential") */
  readonly backoff?: "linear" | "exponential";

  /** Initial delay in ms (default: 1000) */
  readonly initialDelay?: number;

  /** Max delay in ms (default: 30000) */
  readonly maxDelay?: number;

  /** Predicate that decides whether to retry */
  readonly retryOn?: (error: Error) => boolean;
}
```

## CommonConnectionConfig

Base interface for connection configuration objects. Each client provides its
own `XxxConnectionConfig` type that extends this pattern.

```typescript
/**
 * Common connection configuration fields.
 * Client-specific configs may add additional fields.
 */
interface CommonConnectionConfig {
  /** Host name or IP address */
  readonly host: string;

  /** Port number */
  readonly port?: number;

  /** Protocol (client-specific, e.g., "http", "https", "amqp", "amqps") */
  readonly protocol?: string;
}
```

All network clients use the unified `url` option that accepts either:

- A string URL (e.g., `"http://localhost:3000"`)
- A connection config object (e.g., `{ host: "localhost", port: 3000 }`)

## ClientError

```typescript
/**
 * Base client error, shared by all clients.
 * Uses string kind so each client can define its own literal kinds.
 */
class ClientError extends Error {
  readonly kind: string;
  readonly cause?: Error;
}

class ConnectionError extends ClientError {
  readonly kind = "connection" as const;
}

class TimeoutError extends ClientError {
  readonly kind = "timeout" as const;
  readonly timeoutMs: number;
}

class AbortError extends ClientError {
  readonly kind = "abort" as const;
}
```
