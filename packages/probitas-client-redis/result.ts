import type { ClientResult } from "@probitas/client";
import type { RedisError } from "./errors.ts";

/**
 * Base interface for Redis operation results.
 * All Redis result types extend this interface.
 */
interface RedisResultBase<T = unknown> extends ClientResult {
  readonly kind: string;

  /**
   * The value returned by the Redis operation.
   *
   * Type varies based on the specific operation (string, number, array, etc.).
   */
  readonly value: T;
}

// =============================================================================
// RedisCommonResult Types
// =============================================================================

/**
 * Successful Redis operation result (common/generic).
 *
 * Used for operations without a more specific result type.
 */
export interface RedisCommonSuccess<T = unknown> extends RedisResultBase<T> {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:common"` for generic Redis operations.
   */
  readonly kind: "redis:common";

  /**
   * Indicates operation success.
   */
  readonly ok: true;
}

/**
 * Failed Redis operation result (common/generic).
 */
export interface RedisCommonFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:common"` for generic Redis operations.
   */
  readonly kind: "redis:common";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: RedisError;
}

/**
 * Redis operation result (common/generic) - success or failure.
 */
export type RedisCommonResult<T = unknown> =
  | RedisCommonSuccess<T>
  | RedisCommonFailure;

// =============================================================================
// RedisGetResult Types
// =============================================================================

/**
 * Successful Redis GET result.
 */
export interface RedisGetSuccess extends RedisResultBase<string | null> {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:get"` for GET operations.
   */
  readonly kind: "redis:get";

  /**
   * Indicates operation success.
   */
  readonly ok: true;
}

/**
 * Failed Redis GET result.
 */
export interface RedisGetFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:get"` for GET operations.
   */
  readonly kind: "redis:get";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: RedisError;
}

/**
 * Redis GET result - success or failure.
 */
export type RedisGetResult = RedisGetSuccess | RedisGetFailure;

// =============================================================================
// RedisSetResult Types
// =============================================================================

/**
 * Successful Redis SET result.
 */
export interface RedisSetSuccess extends RedisResultBase<"OK"> {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:set"` for SET operations.
   */
  readonly kind: "redis:set";

  /**
   * Indicates operation success.
   */
  readonly ok: true;
}

/**
 * Failed Redis SET result.
 */
export interface RedisSetFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:set"` for SET operations.
   */
  readonly kind: "redis:set";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: RedisError;
}

/**
 * Redis SET result - success or failure.
 */
export type RedisSetResult = RedisSetSuccess | RedisSetFailure;

// =============================================================================
// RedisCountResult Types
// =============================================================================

/**
 * Successful Redis numeric result (DEL, LPUSH, SADD, etc.).
 */
export interface RedisCountSuccess extends RedisResultBase<number> {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:count"` for operations returning counts.
   */
  readonly kind: "redis:count";

  /**
   * Indicates operation success.
   */
  readonly ok: true;
}

/**
 * Failed Redis numeric result.
 */
export interface RedisCountFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:count"` for operations returning counts.
   */
  readonly kind: "redis:count";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: RedisError;
}

/**
 * Redis numeric result (DEL, LPUSH, SADD, etc.) - success or failure.
 */
export type RedisCountResult = RedisCountSuccess | RedisCountFailure;

// =============================================================================
// RedisArrayResult Types
// =============================================================================

/**
 * Successful Redis array result (LRANGE, SMEMBERS, etc.).
 */
export interface RedisArraySuccess<T = string>
  extends RedisResultBase<readonly T[]> {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:array"` for operations returning arrays.
   */
  readonly kind: "redis:array";

  /**
   * Indicates operation success.
   */
  readonly ok: true;
}

/**
 * Failed Redis array result.
 */
export interface RedisArrayFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:array"` for operations returning arrays.
   */
  readonly kind: "redis:array";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: RedisError;
}

/**
 * Redis array result (LRANGE, SMEMBERS, etc.) - success or failure.
 */
export type RedisArrayResult<T = string> =
  | RedisArraySuccess<T>
  | RedisArrayFailure;

// =============================================================================
// RedisHashResult Types
// =============================================================================

/**
 * Successful Redis hash result (HGETALL).
 */
export interface RedisHashSuccess
  extends RedisResultBase<Record<string, string>> {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:hash"` for HGETALL operations.
   */
  readonly kind: "redis:hash";

  /**
   * Indicates operation success.
   */
  readonly ok: true;
}

/**
 * Failed Redis hash result.
 */
export interface RedisHashFailure extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"redis:hash"` for HGETALL operations.
   */
  readonly kind: "redis:hash";

  /**
   * Indicates operation failure.
   */
  readonly ok: false;

  /**
   * Error that caused the failure.
   */
  readonly error: RedisError;
}

/**
 * Redis hash result (HGETALL) - success or failure.
 */
export type RedisHashResult = RedisHashSuccess | RedisHashFailure;

// =============================================================================
// Union Type
// =============================================================================

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

// =============================================================================
// Failure Result Factory Functions
// =============================================================================

/**
 * Create a RedisCommonFailure result.
 */
export function createRedisCommonFailure(
  error: RedisError,
  duration: number,
): RedisCommonFailure {
  return {
    kind: "redis:common",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a RedisGetFailure result.
 */
export function createRedisGetFailure(
  error: RedisError,
  duration: number,
): RedisGetFailure {
  return {
    kind: "redis:get",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a RedisSetFailure result.
 */
export function createRedisSetFailure(
  error: RedisError,
  duration: number,
): RedisSetFailure {
  return {
    kind: "redis:set",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a RedisCountFailure result.
 */
export function createRedisCountFailure(
  error: RedisError,
  duration: number,
): RedisCountFailure {
  return {
    kind: "redis:count",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a RedisArrayFailure result.
 */
export function createRedisArrayFailure(
  error: RedisError,
  duration: number,
): RedisArrayFailure {
  return {
    kind: "redis:array",
    ok: false,
    error,
    duration,
  };
}

/**
 * Create a RedisHashFailure result.
 */
export function createRedisHashFailure(
  error: RedisError,
  duration: number,
): RedisHashFailure {
  return {
    kind: "redis:hash",
    ok: false,
    error,
    duration,
  };
}
