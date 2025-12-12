/**
 * Base interface for Redis operation results.
 * All Redis result types extend this interface.
 */
interface RedisResultBase<T = unknown> {
  readonly type: string;
  readonly ok: boolean;
  readonly value: T;
  readonly duration: number;
}

/**
 * Redis operation result (common/generic)
 */
export interface RedisCommonResult<T = unknown> extends RedisResultBase<T> {
  readonly type: "redis:common";
}

/**
 * Redis GET result
 */
export interface RedisGetResult extends RedisResultBase<string | null> {
  readonly type: "redis:get";
}

/**
 * Redis SET result
 */
export interface RedisSetResult extends RedisResultBase<"OK"> {
  readonly type: "redis:set";
}

/**
 * Redis numeric result (DEL, LPUSH, SADD, etc.)
 */
export interface RedisCountResult extends RedisResultBase<number> {
  readonly type: "redis:count";
}

/**
 * Redis array result (LRANGE, SMEMBERS, etc.)
 */
export interface RedisArrayResult<T = string>
  extends RedisResultBase<readonly T[]> {
  readonly type: "redis:array";
}

/**
 * Redis hash result (HGETALL)
 */
export interface RedisHashResult
  extends RedisResultBase<Record<string, string>> {
  readonly type: "redis:hash";
}

/**
 * Union of all Redis result types.
 */
export type RedisResult<T = unknown> =
  | RedisCommonResult<T>
  | RedisGetResult
  | RedisSetResult
  | RedisCountResult
  | RedisArrayResult<T>
  | RedisHashResult;
