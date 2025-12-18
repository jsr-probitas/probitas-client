import { AbortError, ClientError, TimeoutError } from "@probitas/client";

/**
 * Base error class for Deno KV operations.
 */
export class DenoKvError extends ClientError {
  override readonly name: string = "DenoKvError";

  constructor(message: string, kind: string = "kv", options?: ErrorOptions) {
    super(message, kind, options);
  }
}

/**
 * Error thrown when an atomic operation fails due to check failures.
 */
export class DenoKvAtomicCheckError extends DenoKvError {
  override readonly name = "DenoKvAtomicCheckError";
  override readonly kind = "atomic_check" as const;

  /**
   * The keys whose checks failed.
   */
  readonly failedChecks: readonly Deno.KvKey[];

  constructor(
    message: string,
    failedChecks: readonly Deno.KvKey[],
    options?: ErrorOptions,
  ) {
    super(message, "atomic_check", options);
    this.failedChecks = failedChecks;
  }
}

/**
 * Error thrown when a quota limit is exceeded.
 */
export class DenoKvQuotaError extends DenoKvError {
  override readonly name = "DenoKvQuotaError";
  override readonly kind = "quota" as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, "quota", options);
  }
}

/**
 * Error thrown when a connection to Deno KV fails.
 *
 * This typically occurs when:
 * - Network errors prevent reaching Deno Deploy KV
 * - Authentication/authorization fails
 * - Service is unavailable
 */
export class DenoKvConnectionError extends DenoKvError {
  override readonly name = "DenoKvConnectionError";
  override readonly kind = "connection" as const;

  constructor(message: string, options?: ErrorOptions) {
    super(message, "connection", options);
  }
}

/**
 * Error types that indicate the operation was not processed.
 * These are errors that occur before the operation reaches the Deno KV server.
 */
export type DenoKvFailureError =
  | DenoKvConnectionError
  | AbortError
  | TimeoutError;
