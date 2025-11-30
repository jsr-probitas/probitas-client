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
