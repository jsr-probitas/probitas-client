import type { CommonOptions } from "@probitas/client";

/**
 * Redis operation result (common)
 */
export interface RedisResult<T = unknown> {
  readonly ok: boolean;
  readonly value: T;
  readonly duration: number;
}

/**
 * Redis GET result
 */
export interface RedisGetResult extends RedisResult<string | null> {}

/**
 * Redis SET result
 */
export interface RedisSetResult extends RedisResult<"OK"> {}

/**
 * Redis numeric result (DEL, LPUSH, SADD, etc.)
 */
export interface RedisCountResult extends RedisResult<number> {}

/**
 * Redis array result (LRANGE, SMEMBERS, etc.)
 */
export interface RedisArrayResult<T = string>
  extends RedisResult<readonly T[]> {}

/**
 * Redis hash result (HGETALL)
 */
export interface RedisHashResult extends RedisResult<Record<string, string>> {}

/**
 * Redis SET options
 */
export interface RedisSetOptions extends CommonOptions {
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
 * Redis client configuration
 */
export interface RedisClientConfig extends CommonOptions {
  /** Redis URL (redis://user:password@host:port/db) */
  readonly url?: string;
  /** Redis host */
  readonly host?: string;
  /** Redis port */
  readonly port?: number;
  /** Redis password */
  readonly password?: string;
  /** Database number */
  readonly db?: number;
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
  exec(): Promise<RedisArrayResult<unknown>>;
  discard(): void;
}

/**
 * Redis client interface
 */
export interface RedisClient extends AsyncDisposable {
  readonly config: RedisClientConfig;

  // Strings
  get(key: string, options?: CommonOptions): Promise<RedisGetResult>;
  set(
    key: string,
    value: string,
    options?: RedisSetOptions,
  ): Promise<RedisSetResult>;
  del(...keys: string[]): Promise<RedisCountResult>;
  incr(key: string): Promise<RedisCountResult>;
  decr(key: string): Promise<RedisCountResult>;

  // Hashes
  hget(
    key: string,
    field: string,
    options?: CommonOptions,
  ): Promise<RedisGetResult>;
  hset(
    key: string,
    field: string,
    value: string,
    options?: CommonOptions,
  ): Promise<RedisCountResult>;
  hgetall(key: string, options?: CommonOptions): Promise<RedisHashResult>;
  hdel(key: string, ...fields: string[]): Promise<RedisCountResult>;

  // Lists
  lpush(key: string, ...values: string[]): Promise<RedisCountResult>;
  rpush(key: string, ...values: string[]): Promise<RedisCountResult>;
  lpop(key: string): Promise<RedisGetResult>;
  rpop(key: string): Promise<RedisGetResult>;
  lrange(
    key: string,
    start: number,
    stop: number,
    options?: CommonOptions,
  ): Promise<RedisArrayResult>;
  llen(key: string): Promise<RedisCountResult>;

  // Sets
  sadd(key: string, ...members: string[]): Promise<RedisCountResult>;
  srem(key: string, ...members: string[]): Promise<RedisCountResult>;
  smembers(key: string, options?: CommonOptions): Promise<RedisArrayResult>;
  sismember(key: string, member: string): Promise<RedisResult<boolean>>;

  // Sorted Sets
  zadd(
    key: string,
    ...entries: { score: number; member: string }[]
  ): Promise<RedisCountResult>;
  zrange(
    key: string,
    start: number,
    stop: number,
    options?: CommonOptions,
  ): Promise<RedisArrayResult>;
  zscore(key: string, member: string): Promise<RedisResult<number | null>>;

  // Pub/Sub
  publish(channel: string, message: string): Promise<RedisCountResult>;
  subscribe(channel: string): AsyncIterable<RedisMessage>;

  // Transaction
  multi(): RedisTransaction;

  // Raw command
  command<T = unknown>(
    cmd: string,
    ...args: unknown[]
  ): Promise<RedisResult<T>>;

  close(): Promise<void>;
}
