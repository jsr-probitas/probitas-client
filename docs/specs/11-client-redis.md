# @probitas/client-redis

Redis client package.

**Depends on**: `@probitas/client`

## RedisResult Types

```typescript
/**
 * Common Redis result shape.
 */
interface RedisResult<T = unknown> {
  readonly ok: boolean;
  readonly value: T;
  readonly duration: number;
}

/** Redis GET result */
interface RedisGetResult extends RedisResult<string | null> {}

/** Redis SET result */
interface RedisSetResult extends RedisResult<"OK"> {}

/** Numeric results (DEL, LPUSH, SADD, etc.) */
interface RedisCountResult extends RedisResult<number> {}

/** Array results (LRANGE, SMEMBERS, etc.) */
interface RedisArrayResult<T = string> extends RedisResult<readonly T[]> {}

/** Hash result (HGETALL) */
interface RedisHashResult extends RedisResult<Record<string, string>> {}
```

## RedisError

```typescript
class RedisError extends ClientError {
  readonly code?: string;
}

class RedisConnectionError extends RedisError {}
class RedisCommandError extends RedisError {
  readonly command: string;
}
class RedisScriptError extends RedisError {
  readonly script: string;
}
```

## Expectation Helpers

```typescript
interface RedisResultExpectation<T> {
  ok(): this;
  notOk(): this;
  value(expected: T): this;
  valueMatch(matcher: (value: T) => void): this;
  durationLessThan(ms: number): this;
}

interface RedisCountResultExpectation extends RedisResultExpectation<number> {
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;
}

interface RedisArrayResultExpectation<T>
  extends RedisResultExpectation<readonly T[]> {
  noContent(): this;
  hasContent(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  contains(item: T): this;
}

function expectRedisResult<T>(
  result: RedisResult<T>,
): RedisResultExpectation<T>;
function expectRedisCountResult(
  result: RedisCountResult,
): RedisCountResultExpectation;
function expectRedisArrayResult<T = string>(
  result: RedisArrayResult<T>,
): RedisArrayResultExpectation<T>;
```

## RedisClient

```typescript
/**
 * Redis connection configuration object.
 */
interface RedisConnectionConfig {
  /** Host name or IP address */
  readonly host: string;

  /** Port number (default: 6379) */
  readonly port?: number;

  /** Password for authentication */
  readonly password?: string;

  /** Database index (default: 0) */
  readonly db?: number;
}

interface RedisClientConfig extends CommonOptions {
  /** Connection URL (string or config object) */
  readonly url: string | RedisConnectionConfig;
}

interface RedisClient extends AsyncDisposable {
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

  // Raw
  command<T = unknown>(
    cmd: string,
    ...args: unknown[]
  ): Promise<RedisResult<T>>;

  close(): Promise<void>;
}

interface RedisSetOptions extends CommonOptions {
  readonly ex?: number; // seconds
  readonly px?: number; // milliseconds
  readonly nx?: boolean; // only if key does not exist
  readonly xx?: boolean; // only if key exists
}

interface RedisMessage {
  readonly channel: string;
  readonly message: string;
}

interface RedisTransaction {
  get(key: string): this;
  set(key: string, value: string, options?: RedisSetOptions): this;
  del(...keys: string[]): this;
  // ... other commands
  exec(): Promise<RedisArrayResult<unknown>>;
  discard(): void;
}

function createRedisClient(config: RedisClientConfig): Promise<RedisClient>;
```

## Example

```typescript
import {
  createRedisClient,
  expectRedisArrayResult,
  expectRedisResult,
} from "@probitas/client-redis";

const redis = await createRedisClient({
  url: "redis://localhost:6379",
});

// Strings
await redis.set("key", "value", { ex: 3600 });
const getResult = await redis.get("key");
expectRedisResult(getResult).ok().value("value");

// Lists
await redis.lpush("list", "a", "b", "c");
const listResult = await redis.lrange("list", 0, -1);
expectRedisArrayResult(listResult).ok().count(3).contains("a");

// Transaction
const tx = redis.multi();
tx.set("x", "1");
tx.incr("x");
const txResult = await tx.exec();

// Using connection config object
const redisWithConfig = await createRedisClient({
  url: { host: "localhost", port: 6379, db: 0 },
});

await redis.close();
```
