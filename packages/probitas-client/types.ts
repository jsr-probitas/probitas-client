/**
 * Common connection configuration shared across all network clients.
 *
 * This interface provides a unified way to configure connection parameters
 * for all network-based clients. Each client extends this with service-specific
 * options while maintaining a consistent base.
 *
 * @example
 * ```ts
 * // Use with string URL
 * createHttpClient({ url: "http://localhost:3000" });
 *
 * // Use with config object
 * createHttpClient({
 *   url: {
 *     host: "api.example.com",
 *     port: 443,
 *     username: "user",
 *     password: "secret",
 *   },
 * });
 * ```
 */
export interface CommonConnectionConfig {
  /**
   * Hostname or IP address.
   * @default "localhost"
   */
  readonly host?: string;

  /**
   * Port number. Each service has its own default.
   */
  readonly port?: number;

  /**
   * Username for authentication.
   */
  readonly username?: string;

  /**
   * Password for authentication.
   */
  readonly password?: string;
}

/**
 * Retry configuration options.
 */
export interface RetryOptions {
  /**
   * Maximum number of attempts (1 = no retry).
   * @default 1
   */
  readonly maxAttempts?: number;

  /**
   * Backoff strategy.
   * @default "exponential"
   */
  readonly backoff?: "linear" | "exponential";

  /**
   * Initial delay in milliseconds.
   * @default 1000
   */
  readonly initialDelay?: number;

  /**
   * Maximum delay in milliseconds.
   * @default 30000
   */
  readonly maxDelay?: number;

  /**
   * Function to determine if the error should trigger a retry.
   */
  readonly retryOn?: (error: Error) => boolean;
}

/**
 * Common options shared across all clients.
 */
export interface CommonOptions {
  /**
   * Timeout in milliseconds.
   */
  readonly timeout?: number;

  /**
   * AbortSignal for cancellation.
   */
  readonly signal?: AbortSignal;

  /**
   * Retry configuration.
   */
  readonly retry?: RetryOptions;
}
