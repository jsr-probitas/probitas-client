import { Redis } from "ioredis";
import { AbortError, TimeoutError } from "@probitas/client";
import type { CommonOptions } from "@probitas/client";
import type {
  RedisArrayResult,
  RedisClient,
  RedisClientConfig,
  RedisCountResult,
  RedisGetResult,
  RedisHashResult,
  RedisMessage,
  RedisResult,
  RedisSetOptions,
  RedisSetResult,
  RedisTransaction,
} from "./types.ts";
import { RedisCommandError, RedisConnectionError } from "./errors.ts";

type RedisInstance = InstanceType<typeof Redis>;

/**
 * Execute a promise with timeout and abort signal support.
 */
async function withOptions<T>(
  promise: Promise<T>,
  options: CommonOptions | undefined,
  command: string,
): Promise<T> {
  if (!options?.timeout && !options?.signal) {
    return promise;
  }

  const controllers: { cleanup: () => void }[] = [];

  try {
    const racePromises: Promise<T>[] = [promise];

    // Handle timeout
    if (options.timeout !== undefined) {
      const timeoutMs = options.timeout;
      let timeoutId: number;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new TimeoutError(`Command timed out: ${command}`, timeoutMs));
        }, timeoutMs);
      });
      controllers.push({ cleanup: () => clearTimeout(timeoutId) });
      racePromises.push(timeoutPromise);
    }

    // Handle abort signal
    if (options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        throw new AbortError(`Command aborted: ${command}`);
      }

      const abortPromise = new Promise<never>((_, reject) => {
        const onAbort = () => {
          reject(new AbortError(`Command aborted: ${command}`));
        };
        signal.addEventListener("abort", onAbort, { once: true });
        controllers.push({
          cleanup: () => signal.removeEventListener("abort", onAbort),
        });
      });
      racePromises.push(abortPromise);
    }

    return await Promise.race(racePromises);
  } finally {
    for (const controller of controllers) {
      controller.cleanup();
    }
  }
}

/**
 * Create a Redis client.
 *
 * @example
 * ```typescript
 * // Using URL
 * const client = await createRedisClient({
 *   url: "redis://localhost:6379/0",
 * });
 *
 * // Using host/port
 * const client = await createRedisClient({
 *   host: "localhost",
 *   port: 6379,
 *   db: 0,
 * });
 *
 * await client.set("key", "value", { ex: 3600 });
 * const result = await client.get("key");
 * console.log(result.value); // "value"
 *
 * await client.close();
 * ```
 */
export async function createRedisClient(
  config: RedisClientConfig,
): Promise<RedisClient> {
  let redis: RedisInstance;

  try {
    if (config.url) {
      redis = new Redis(config.url, {
        lazyConnect: true,
        connectTimeout: config.timeout ?? 10000,
      });
    } else {
      redis = new Redis({
        host: config.host ?? "localhost",
        port: config.port ?? 6379,
        password: config.password,
        db: config.db ?? 0,
        lazyConnect: true,
        connectTimeout: config.timeout ?? 10000,
      });
    }

    await redis.connect();
  } catch (error) {
    throw new RedisConnectionError(
      `Failed to connect to Redis: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  return new RedisClientImpl(config, redis);
}

function convertRedisError(error: unknown, command: string): never {
  if (error instanceof TimeoutError || error instanceof AbortError) {
    throw error;
  }
  if (error instanceof Error) {
    throw new RedisCommandError(error.message, {
      command,
      cause: error,
    });
  }
  throw new RedisCommandError(String(error), { command });
}

class RedisClientImpl implements RedisClient {
  readonly config: RedisClientConfig;
  readonly #redis: RedisInstance;
  #closed = false;

  constructor(config: RedisClientConfig, redis: RedisInstance) {
    this.config = config;
    this.#redis = redis;
  }

  // Strings

  async get(key: string, options?: CommonOptions): Promise<RedisGetResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `GET ${key}`;
    try {
      const value = await withOptions(this.#redis.get(key), options, command);
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async set(
    key: string,
    value: string,
    options?: RedisSetOptions,
  ): Promise<RedisSetResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `SET ${key}`;
    try {
      const args: (string | number)[] = [key, value];

      if (options?.ex !== undefined) {
        args.push("EX", options.ex);
      } else if (options?.px !== undefined) {
        args.push("PX", options.px);
      }

      if (options?.nx) {
        args.push("NX");
      } else if (options?.xx) {
        args.push("XX");
      }

      const result = await withOptions(
        this.#redis.set(...(args as [string, string])),
        options,
        command,
      );
      return {
        ok: result === "OK",
        value: "OK",
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async del(...keys: string[]): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `DEL ${keys.join(" ")}`;
    try {
      const count = await this.#redis.del(...keys);
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async incr(key: string): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `INCR ${key}`;
    try {
      const value = await this.#redis.incr(key);
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async decr(key: string): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `DECR ${key}`;
    try {
      const value = await this.#redis.decr(key);
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  // Hashes

  async hget(
    key: string,
    field: string,
    options?: CommonOptions,
  ): Promise<RedisGetResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `HGET ${key} ${field}`;
    try {
      const value = await withOptions(
        this.#redis.hget(key, field),
        options,
        command,
      );
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async hset(
    key: string,
    field: string,
    value: string,
    options?: CommonOptions,
  ): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `HSET ${key} ${field}`;
    try {
      const count = await withOptions(
        this.#redis.hset(key, field, value),
        options,
        command,
      );
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async hgetall(
    key: string,
    options?: CommonOptions,
  ): Promise<RedisHashResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `HGETALL ${key}`;
    try {
      const value = await withOptions(
        this.#redis.hgetall(key),
        options,
        command,
      );
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async hdel(key: string, ...fields: string[]): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `HDEL ${key} ${fields.join(" ")}`;
    try {
      const count = await this.#redis.hdel(key, ...fields);
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  // Lists

  async lpush(key: string, ...values: string[]): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `LPUSH ${key}`;
    try {
      const count = await this.#redis.lpush(key, ...values);
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async rpush(key: string, ...values: string[]): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `RPUSH ${key}`;
    try {
      const count = await this.#redis.rpush(key, ...values);
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async lpop(key: string): Promise<RedisGetResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `LPOP ${key}`;
    try {
      const value = await this.#redis.lpop(key);
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async rpop(key: string): Promise<RedisGetResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `RPOP ${key}`;
    try {
      const value = await this.#redis.rpop(key);
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async lrange(
    key: string,
    start: number,
    stop: number,
    options?: CommonOptions,
  ): Promise<RedisArrayResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `LRANGE ${key} ${start} ${stop}`;
    try {
      const value = await withOptions(
        this.#redis.lrange(key, start, stop),
        options,
        command,
      );
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async llen(key: string): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `LLEN ${key}`;
    try {
      const value = await this.#redis.llen(key);
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  // Sets

  async sadd(key: string, ...members: string[]): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `SADD ${key}`;
    try {
      const count = await this.#redis.sadd(key, ...members);
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async srem(key: string, ...members: string[]): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `SREM ${key}`;
    try {
      const count = await this.#redis.srem(key, ...members);
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async smembers(
    key: string,
    options?: CommonOptions,
  ): Promise<RedisArrayResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `SMEMBERS ${key}`;
    try {
      const value = await withOptions(
        this.#redis.smembers(key),
        options,
        command,
      );
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async sismember(
    key: string,
    member: string,
  ): Promise<RedisResult<boolean>> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `SISMEMBER ${key} ${member}`;
    try {
      const result = await this.#redis.sismember(key, member);
      return {
        ok: true,
        value: result === 1,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  // Sorted Sets

  async zadd(
    key: string,
    ...entries: { score: number; member: string }[]
  ): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `ZADD ${key}`;
    try {
      const args: (string | number)[] = [];
      for (const entry of entries) {
        args.push(entry.score, entry.member);
      }
      const count = await this.#redis.zadd(key, ...args);
      return {
        ok: true,
        value: count as number,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async zrange(
    key: string,
    start: number,
    stop: number,
    options?: CommonOptions,
  ): Promise<RedisArrayResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `ZRANGE ${key} ${start} ${stop}`;
    try {
      const value = await withOptions(
        this.#redis.zrange(key, start, stop),
        options,
        command,
      );
      return {
        ok: true,
        value,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async zscore(
    key: string,
    member: string,
  ): Promise<RedisResult<number | null>> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `ZSCORE ${key} ${member}`;
    try {
      const value = await this.#redis.zscore(key, member);
      return {
        ok: true,
        value: value !== null ? parseFloat(value) : null,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  // Pub/Sub

  async publish(
    channel: string,
    message: string,
  ): Promise<RedisCountResult> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `PUBLISH ${channel}`;
    try {
      const count = await this.#redis.publish(channel, message);
      return {
        ok: true,
        value: count,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async *subscribe(channel: string): AsyncIterable<RedisMessage> {
    this.#ensureOpen();

    // Create a duplicate connection for subscription
    const subscriber = this.#redis.duplicate();

    try {
      await subscriber.subscribe(channel);

      const messageQueue: RedisMessage[] = [];
      let resolver: ((value: RedisMessage) => void) | null = null;
      let done = false;

      subscriber.on("message", (ch: string, msg: string) => {
        const message = { channel: ch, message: msg };
        if (resolver) {
          resolver(message);
          resolver = null;
        } else {
          messageQueue.push(message);
        }
      });

      subscriber.on("end", () => {
        done = true;
        if (resolver) {
          // Signal end by resolving with a special marker
          resolver = null;
        }
      });

      while (!done && !this.#closed) {
        if (messageQueue.length > 0) {
          yield messageQueue.shift()!;
        } else {
          const message = await new Promise<RedisMessage | null>((resolve) => {
            resolver = resolve as (value: RedisMessage) => void;
            // Check if already done
            if (done) resolve(null);
          });
          if (message) {
            yield message;
          } else {
            break;
          }
        }
      }
    } finally {
      await subscriber.unsubscribe(channel);
      subscriber.disconnect();
    }
  }

  // Transaction

  multi(): RedisTransaction {
    this.#ensureOpen();
    return new RedisTransactionImpl(this.#redis);
  }

  // Raw command

  async command<T = unknown>(
    cmd: string,
    ...args: unknown[]
  ): Promise<RedisResult<T>> {
    this.#ensureOpen();
    const startTime = performance.now();
    const command = `${cmd} ${args.join(" ")}`;
    try {
      // deno-lint-ignore no-explicit-any
      const value = await (this.#redis as any).call(cmd, ...args);
      return {
        ok: true,
        value: value as T,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, command);
    }
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    this.#redis.disconnect();
    await Promise.resolve(); // Ensure async for consistency
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }

  #ensureOpen(): void {
    if (this.#closed) {
      throw new RedisCommandError("Client is closed", { command: "" });
    }
  }
}

class RedisTransactionImpl implements RedisTransaction {
  // deno-lint-ignore no-explicit-any
  readonly #pipeline: any;
  #discarded = false;

  constructor(redis: RedisInstance) {
    this.#pipeline = redis.multi();
  }

  get(key: string): this {
    this.#pipeline.get(key);
    return this;
  }

  set(key: string, value: string, options?: RedisSetOptions): this {
    if (options?.ex !== undefined) {
      this.#pipeline.set(key, value, "EX", options.ex);
    } else if (options?.px !== undefined) {
      this.#pipeline.set(key, value, "PX", options.px);
    } else if (options?.nx) {
      this.#pipeline.set(key, value, "NX");
    } else if (options?.xx) {
      this.#pipeline.set(key, value, "XX");
    } else {
      this.#pipeline.set(key, value);
    }
    return this;
  }

  del(...keys: string[]): this {
    this.#pipeline.del(...keys);
    return this;
  }

  incr(key: string): this {
    this.#pipeline.incr(key);
    return this;
  }

  decr(key: string): this {
    this.#pipeline.decr(key);
    return this;
  }

  hget(key: string, field: string): this {
    this.#pipeline.hget(key, field);
    return this;
  }

  hset(key: string, field: string, value: string): this {
    this.#pipeline.hset(key, field, value);
    return this;
  }

  hgetall(key: string): this {
    this.#pipeline.hgetall(key);
    return this;
  }

  hdel(key: string, ...fields: string[]): this {
    this.#pipeline.hdel(key, ...fields);
    return this;
  }

  lpush(key: string, ...values: string[]): this {
    this.#pipeline.lpush(key, ...values);
    return this;
  }

  rpush(key: string, ...values: string[]): this {
    this.#pipeline.rpush(key, ...values);
    return this;
  }

  lpop(key: string): this {
    this.#pipeline.lpop(key);
    return this;
  }

  rpop(key: string): this {
    this.#pipeline.rpop(key);
    return this;
  }

  lrange(key: string, start: number, stop: number): this {
    this.#pipeline.lrange(key, start, stop);
    return this;
  }

  llen(key: string): this {
    this.#pipeline.llen(key);
    return this;
  }

  sadd(key: string, ...members: string[]): this {
    this.#pipeline.sadd(key, ...members);
    return this;
  }

  srem(key: string, ...members: string[]): this {
    this.#pipeline.srem(key, ...members);
    return this;
  }

  smembers(key: string): this {
    this.#pipeline.smembers(key);
    return this;
  }

  sismember(key: string, member: string): this {
    this.#pipeline.sismember(key, member);
    return this;
  }

  zadd(key: string, ...entries: { score: number; member: string }[]): this {
    const args: (string | number)[] = [];
    for (const entry of entries) {
      args.push(entry.score, entry.member);
    }
    this.#pipeline.zadd(key, ...args);
    return this;
  }

  zrange(key: string, start: number, stop: number): this {
    this.#pipeline.zrange(key, start, stop);
    return this;
  }

  zscore(key: string, member: string): this {
    this.#pipeline.zscore(key, member);
    return this;
  }

  async exec(): Promise<RedisArrayResult<unknown>> {
    if (this.#discarded) {
      throw new RedisCommandError("Transaction was discarded", {
        command: "EXEC",
      });
    }

    const startTime = performance.now();
    try {
      const results = await this.#pipeline.exec();
      // ioredis returns [[error, result], ...] format
      // deno-lint-ignore no-explicit-any
      const values = results?.map(([err, val]: [Error | null, any]) => {
        if (err) throw err;
        return val;
      }) ?? [];

      return {
        ok: true,
        value: values,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertRedisError(error, "EXEC");
    }
  }

  discard(): void {
    this.#discarded = true;
    this.#pipeline.discard();
  }
}
