import type { CommonConnectionConfig, CommonOptions } from "@probitas/client";
import type {
  RedisArrayFailure,
  RedisArrayResult,
  RedisArraySuccess,
  RedisCommonFailure,
  RedisCommonResult,
  RedisCommonSuccess,
  RedisCountFailure,
  RedisCountResult,
  RedisCountSuccess,
  RedisGetFailure,
  RedisGetResult,
  RedisGetSuccess,
  RedisHashFailure,
  RedisHashResult,
  RedisHashSuccess,
  RedisResult,
  RedisSetFailure,
  RedisSetResult,
  RedisSetSuccess,
} from "./result.ts";

export type {
  RedisArrayFailure,
  RedisArrayResult,
  RedisArraySuccess,
  RedisCommonFailure,
  RedisCommonResult,
  RedisCommonSuccess,
  RedisCountFailure,
  RedisCountResult,
  RedisCountSuccess,
  RedisGetFailure,
  RedisGetResult,
  RedisGetSuccess,
  RedisHashFailure,
  RedisHashResult,
  RedisHashSuccess,
  RedisResult,
  RedisSetFailure,
  RedisSetResult,
  RedisSetSuccess,
};

/**
 * Common options for Redis operations with throwOnError support.
 */
export interface RedisOptions extends CommonOptions {
  /**
   * Whether to throw an error when an operation fails.
   *
   * When `false` (default), errors are returned as part of the result object
   * with `ok: false` and an `error` property containing the error details.
   *
   * When `true`, errors are thrown as exceptions.
   *
   * @default false (inherited from client config, or false if not set)
   */
  readonly throwOnError?: boolean;
}

/**
 * Redis SET options
 */
export interface RedisSetOptions extends RedisOptions {
  /** Expiration in seconds */
  readonly ex?: number;
  /** Expiration in milliseconds */
  readonly px?: number;
  /** Only set if key does not exist */
  readonly nx?: boolean;
  /** Only set if key exists */
  readonly xx?: boolean;
}

/**
 * Redis Pub/Sub message
 */
export interface RedisMessage {
  readonly channel: string;
  readonly message: string;
}

/**
 * Redis connection configuration.
 *
 * Extends CommonConnectionConfig with Redis-specific options.
 */
export interface RedisConnectionConfig extends CommonConnectionConfig {
  /**
   * Database index.
   * @default 0
   */
  readonly db?: number;
}

/**
 * Redis client configuration.
 */
export interface RedisClientConfig extends RedisOptions {
  /**
   * Redis connection URL or configuration object.
   *
   * @example String URL
   * ```ts
   * import type { RedisClientConfig } from "@probitas/client-redis";
   * const config: RedisClientConfig = { url: "redis://localhost:6379" };
   * ```
   *
   * @example With password
   * ```ts
   * import type { RedisClientConfig } from "@probitas/client-redis";
   * const config: RedisClientConfig = { url: "redis://:password@localhost:6379/0" };
   * ```
   *
   * @example Config object
   * ```ts
   * import type { RedisClientConfig } from "@probitas/client-redis";
   * const config: RedisClientConfig = {
   *   url: { port: 6379, password: "secret", db: 1 },
   * };
   * ```
   */
  readonly url: string | RedisConnectionConfig;
}

/**
 * Redis transaction interface
 */
export interface RedisTransaction {
  get(key: string): this;
  set(key: string, value: string, options?: RedisSetOptions): this;
  del(...keys: string[]): this;
  incr(key: string): this;
  decr(key: string): this;
  hget(key: string, field: string): this;
  hset(key: string, field: string, value: string): this;
  hgetall(key: string): this;
  hdel(key: string, ...fields: string[]): this;
  lpush(key: string, ...values: string[]): this;
  rpush(key: string, ...values: string[]): this;
  lpop(key: string): this;
  rpop(key: string): this;
  lrange(key: string, start: number, stop: number): this;
  llen(key: string): this;
  sadd(key: string, ...members: string[]): this;
  srem(key: string, ...members: string[]): this;
  smembers(key: string): this;
  sismember(key: string, member: string): this;
  zadd(key: string, ...entries: { score: number; member: string }[]): this;
  zrange(key: string, start: number, stop: number): this;
  zscore(key: string, member: string): this;
  exec(options?: RedisOptions): Promise<RedisArrayResult<unknown>>;
  discard(): void;
}

/**
 * Redis client interface
 */
export interface RedisClient extends AsyncDisposable {
  readonly config: RedisClientConfig;

  // Strings
  get(key: string, options?: RedisOptions): Promise<RedisGetResult>;
  set(
    key: string,
    value: string,
    options?: RedisSetOptions,
  ): Promise<RedisSetResult>;
  del(...keys: string[]): Promise<RedisCountResult>;
  incr(key: string, options?: RedisOptions): Promise<RedisCountResult>;
  decr(key: string, options?: RedisOptions): Promise<RedisCountResult>;

  // Hashes
  hget(
    key: string,
    field: string,
    options?: RedisOptions,
  ): Promise<RedisGetResult>;
  hset(
    key: string,
    field: string,
    value: string,
    options?: RedisOptions,
  ): Promise<RedisCountResult>;
  hgetall(key: string, options?: RedisOptions): Promise<RedisHashResult>;
  hdel(key: string, ...fields: string[]): Promise<RedisCountResult>;

  // Lists
  lpush(key: string, ...values: string[]): Promise<RedisCountResult>;
  rpush(key: string, ...values: string[]): Promise<RedisCountResult>;
  lpop(key: string, options?: RedisOptions): Promise<RedisGetResult>;
  rpop(key: string, options?: RedisOptions): Promise<RedisGetResult>;
  lrange(
    key: string,
    start: number,
    stop: number,
    options?: RedisOptions,
  ): Promise<RedisArrayResult>;
  llen(key: string, options?: RedisOptions): Promise<RedisCountResult>;

  // Sets
  sadd(key: string, ...members: string[]): Promise<RedisCountResult>;
  srem(key: string, ...members: string[]): Promise<RedisCountResult>;
  smembers(key: string, options?: RedisOptions): Promise<RedisArrayResult>;
  sismember(
    key: string,
    member: string,
    options?: RedisOptions,
  ): Promise<RedisCommonResult<boolean>>;

  // Sorted Sets
  zadd(
    key: string,
    ...entries: { score: number; member: string }[]
  ): Promise<RedisCountResult>;
  zrange(
    key: string,
    start: number,
    stop: number,
    options?: RedisOptions,
  ): Promise<RedisArrayResult>;
  zscore(
    key: string,
    member: string,
    options?: RedisOptions,
  ): Promise<RedisCommonResult<number | null>>;

  // Pub/Sub
  publish(
    channel: string,
    message: string,
    options?: RedisOptions,
  ): Promise<RedisCountResult>;
  subscribe(channel: string): AsyncIterable<RedisMessage>;

  // Transaction
  multi(): RedisTransaction;

  // Raw command
  command<T = unknown>(
    cmd: string,
    ...args: unknown[]
  ): Promise<RedisCommonResult<T>>;

  close(): Promise<void>;
}
