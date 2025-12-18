import type { ClientResult } from "@probitas/client";
import type { DenoKvError, DenoKvFailureError } from "./errors.ts";

// ============================================================================
// DenoKvGetResult
// ============================================================================

/**
 * Base interface for get operation results.
 */
// deno-lint-ignore no-explicit-any
interface DenoKvGetResultBase<T = any> extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"deno-kv:get"` for KV get operations.
   */
  readonly kind: "deno-kv:get";

  /**
   * Whether the operation was processed by the server.
   */
  readonly processed: boolean;

  /**
   * Whether the operation was successful.
   */
  readonly ok: boolean;

  /**
   * Error that occurred during the operation.
   */
  readonly error: DenoKvError | DenoKvFailureError | null;

  /**
   * The key that was requested (null for connection failures).
   */
  readonly key: Deno.KvKey | null;

  /**
   * The retrieved value (null if key doesn't exist or operation failed).
   */
  readonly value: T | null;

  /**
   * Version identifier for optimistic concurrency (null if key doesn't exist or failed).
   */
  readonly versionstamp: string | null;
}

/**
 * Successful get operation result.
 */
// deno-lint-ignore no-explicit-any
export interface DenoKvGetResultSuccess<T = any>
  extends DenoKvGetResultBase<T> {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly key: Deno.KvKey;
  readonly value: T | null;
  readonly versionstamp: string | null;
}

/**
 * Get operation result with KV error (quota exceeded, etc.).
 */
// deno-lint-ignore no-explicit-any
export interface DenoKvGetResultError<T = any> extends DenoKvGetResultBase<T> {
  readonly processed: true;
  readonly ok: false;
  readonly error: DenoKvError;
  readonly key: Deno.KvKey;
  readonly value: null;
  readonly versionstamp: null;
}

/**
 * Get operation result with connection failure.
 */
// deno-lint-ignore no-explicit-any
export interface DenoKvGetResultFailure<T = any>
  extends DenoKvGetResultBase<T> {
  readonly processed: false;
  readonly ok: false;
  readonly error: DenoKvFailureError;
  readonly key: null;
  readonly value: null;
  readonly versionstamp: null;
}

/**
 * Result of a get operation.
 *
 * Use `ok` to check for success, then narrow the type:
 * - `ok === true`: Success - value may be present
 * - `ok === false && processed === true`: KV error (quota, etc.)
 * - `ok === false && processed === false`: Connection failure
 */
// deno-lint-ignore no-explicit-any
export type DenoKvGetResult<T = any> =
  | DenoKvGetResultSuccess<T>
  | DenoKvGetResultError<T>
  | DenoKvGetResultFailure<T>;

// ============================================================================
// DenoKvSetResult
// ============================================================================

/**
 * Base interface for set operation results.
 */
interface DenoKvSetResultBase extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"deno-kv:set"` for KV set operations.
   */
  readonly kind: "deno-kv:set";

  /**
   * Whether the operation was processed by the server.
   */
  readonly processed: boolean;

  /**
   * Whether the operation was successful.
   */
  readonly ok: boolean;

  /**
   * Error that occurred during the operation.
   */
  readonly error: DenoKvError | DenoKvFailureError | null;

  /**
   * Version identifier for the newly written value (null if failed).
   */
  readonly versionstamp: string | null;
}

/**
 * Successful set operation result.
 */
export interface DenoKvSetResultSuccess extends DenoKvSetResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly versionstamp: string;
}

/**
 * Set operation result with KV error (quota exceeded, etc.).
 */
export interface DenoKvSetResultError extends DenoKvSetResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: DenoKvError;
  readonly versionstamp: null;
}

/**
 * Set operation result with connection failure.
 */
export interface DenoKvSetResultFailure extends DenoKvSetResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: DenoKvFailureError;
  readonly versionstamp: null;
}

/**
 * Result of a set operation.
 */
export type DenoKvSetResult =
  | DenoKvSetResultSuccess
  | DenoKvSetResultError
  | DenoKvSetResultFailure;

// ============================================================================
// DenoKvDeleteResult
// ============================================================================

/**
 * Base interface for delete operation results.
 */
interface DenoKvDeleteResultBase extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"deno-kv:delete"` for KV delete operations.
   */
  readonly kind: "deno-kv:delete";

  /**
   * Whether the operation was processed by the server.
   */
  readonly processed: boolean;

  /**
   * Whether the operation was successful.
   */
  readonly ok: boolean;

  /**
   * Error that occurred during the operation.
   */
  readonly error: DenoKvError | DenoKvFailureError | null;
}

/**
 * Successful delete operation result.
 */
export interface DenoKvDeleteResultSuccess extends DenoKvDeleteResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
}

/**
 * Delete operation result with KV error.
 */
export interface DenoKvDeleteResultError extends DenoKvDeleteResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: DenoKvError;
}

/**
 * Delete operation result with connection failure.
 */
export interface DenoKvDeleteResultFailure extends DenoKvDeleteResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: DenoKvFailureError;
}

/**
 * Result of a delete operation.
 */
export type DenoKvDeleteResult =
  | DenoKvDeleteResultSuccess
  | DenoKvDeleteResultError
  | DenoKvDeleteResultFailure;

// ============================================================================
// DenoKvListResult
// ============================================================================

/**
 * A single entry in the KV store.
 */
// deno-lint-ignore no-explicit-any
export interface DenoKvEntry<T = any> {
  readonly key: Deno.KvKey;
  readonly value: T;
  readonly versionstamp: string;
}

/**
 * Base interface for list operation results.
 */
// deno-lint-ignore no-explicit-any
interface DenoKvListResultBase<T = any> extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"deno-kv:list"` for KV list operations.
   */
  readonly kind: "deno-kv:list";

  /**
   * Whether the operation was processed by the server.
   */
  readonly processed: boolean;

  /**
   * Whether the operation was successful.
   */
  readonly ok: boolean;

  /**
   * Error that occurred during the operation.
   */
  readonly error: DenoKvError | DenoKvFailureError | null;

  /**
   * Array of entries matching the list selector.
   */
  readonly entries: readonly DenoKvEntry<T>[];
}

/**
 * Successful list operation result.
 */
// deno-lint-ignore no-explicit-any
export interface DenoKvListResultSuccess<T = any>
  extends DenoKvListResultBase<T> {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly entries: readonly DenoKvEntry<T>[];
}

/**
 * List operation result with KV error.
 */
// deno-lint-ignore no-explicit-any
export interface DenoKvListResultError<T = any>
  extends DenoKvListResultBase<T> {
  readonly processed: true;
  readonly ok: false;
  readonly error: DenoKvError;
  readonly entries: readonly DenoKvEntry<T>[];
}

/**
 * List operation result with connection failure.
 */
// deno-lint-ignore no-explicit-any
export interface DenoKvListResultFailure<T = any>
  extends DenoKvListResultBase<T> {
  readonly processed: false;
  readonly ok: false;
  readonly error: DenoKvFailureError;
  readonly entries: readonly DenoKvEntry<T>[];
}

/**
 * Result of a list operation.
 */
// deno-lint-ignore no-explicit-any
export type DenoKvListResult<T = any> =
  | DenoKvListResultSuccess<T>
  | DenoKvListResultError<T>
  | DenoKvListResultFailure<T>;

// ============================================================================
// DenoKvAtomicResult
// ============================================================================

/**
 * Base interface for atomic operation results.
 */
interface DenoKvAtomicResultBase extends ClientResult {
  /**
   * Result kind discriminator.
   *
   * Always `"deno-kv:atomic"` for KV atomic operations.
   */
  readonly kind: "deno-kv:atomic";

  /**
   * Whether the operation was processed by the server.
   */
  readonly processed: boolean;

  /**
   * Whether the atomic operation was committed successfully.
   *
   * - `true`: All checks passed and mutations were applied
   * - `false`: Either a check failed, an error occurred, or connection failed
   */
  readonly ok: boolean;

  /**
   * Error that occurred during the operation.
   *
   * - `null` for success or check failure (check failure is not an error)
   * - `DenoKvError` for KV errors (quota exceeded, etc.)
   * - `DenoKvConnectionError` for connection failures
   */
  readonly error: DenoKvError | null;

  /**
   * Version identifier for the atomic commit (null if not committed).
   */
  readonly versionstamp: string | null;
}

/**
 * Atomic operation successfully committed.
 */
export interface DenoKvAtomicResultCommitted extends DenoKvAtomicResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly versionstamp: string;
}

/**
 * Atomic operation check failed (version mismatch).
 *
 * This is NOT an error - it's an expected outcome when using optimistic concurrency.
 * Retry the operation with updated versionstamps.
 */
export interface DenoKvAtomicResultCheckFailed extends DenoKvAtomicResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: null;
  readonly versionstamp: null;
}

/**
 * Atomic operation failed with KV error.
 */
export interface DenoKvAtomicResultError extends DenoKvAtomicResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: DenoKvError;
  readonly versionstamp: null;
}

/**
 * Atomic operation failed with connection error.
 */
export interface DenoKvAtomicResultFailure extends DenoKvAtomicResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: DenoKvFailureError;
  readonly versionstamp: null;
}

/**
 * Result of an atomic operation.
 *
 * Use `ok` and `error` to distinguish between outcomes:
 * - `ok === true`: Committed successfully
 * - `ok === false && error === null`: Check failed (retry with new versionstamp)
 * - `ok === false && error !== null`: KV error or connection failure
 */
export type DenoKvAtomicResult =
  | DenoKvAtomicResultCommitted
  | DenoKvAtomicResultCheckFailed
  | DenoKvAtomicResultError
  | DenoKvAtomicResultFailure;

// ============================================================================
// Factory Functions
// ============================================================================

/**
 * Create a successful get result.
 */
export function createDenoKvGetResultSuccess<T>(
  params: {
    key: Deno.KvKey;
    value: T | null;
    versionstamp: string | null;
    duration: number;
  },
): DenoKvGetResultSuccess<T> {
  return {
    kind: "deno-kv:get",
    processed: true,
    ok: true,
    error: null,
    key: params.key,
    value: params.value,
    versionstamp: params.versionstamp,
    duration: params.duration,
  };
}

/**
 * Create a get result with KV error.
 */
export function createDenoKvGetResultError<T>(
  params: {
    key: Deno.KvKey;
    error: DenoKvError;
    duration: number;
  },
): DenoKvGetResultError<T> {
  return {
    kind: "deno-kv:get",
    processed: true,
    ok: false,
    error: params.error,
    key: params.key,
    value: null,
    versionstamp: null,
    duration: params.duration,
  };
}

/**
 * Create a get result with connection failure.
 */
export function createDenoKvGetResultFailure<T>(
  params: {
    error: DenoKvFailureError;
    duration: number;
  },
): DenoKvGetResultFailure<T> {
  return {
    kind: "deno-kv:get",
    processed: false,
    ok: false,
    error: params.error,
    key: null,
    value: null,
    versionstamp: null,
    duration: params.duration,
  };
}

/**
 * Create a successful set result.
 */
export function createDenoKvSetResultSuccess(
  params: {
    versionstamp: string;
    duration: number;
  },
): DenoKvSetResultSuccess {
  return {
    kind: "deno-kv:set",
    processed: true,
    ok: true,
    error: null,
    versionstamp: params.versionstamp,
    duration: params.duration,
  };
}

/**
 * Create a set result with KV error.
 */
export function createDenoKvSetResultError(
  params: {
    error: DenoKvError;
    duration: number;
  },
): DenoKvSetResultError {
  return {
    kind: "deno-kv:set",
    processed: true,
    ok: false,
    error: params.error,
    versionstamp: null,
    duration: params.duration,
  };
}

/**
 * Create a set result with connection failure.
 */
export function createDenoKvSetResultFailure(
  params: {
    error: DenoKvFailureError;
    duration: number;
  },
): DenoKvSetResultFailure {
  return {
    kind: "deno-kv:set",
    processed: false,
    ok: false,
    error: params.error,
    versionstamp: null,
    duration: params.duration,
  };
}

/**
 * Create a successful delete result.
 */
export function createDenoKvDeleteResultSuccess(
  params: {
    duration: number;
  },
): DenoKvDeleteResultSuccess {
  return {
    kind: "deno-kv:delete",
    processed: true,
    ok: true,
    error: null,
    duration: params.duration,
  };
}

/**
 * Create a delete result with KV error.
 */
export function createDenoKvDeleteResultError(
  params: {
    error: DenoKvError;
    duration: number;
  },
): DenoKvDeleteResultError {
  return {
    kind: "deno-kv:delete",
    processed: true,
    ok: false,
    error: params.error,
    duration: params.duration,
  };
}

/**
 * Create a delete result with connection failure.
 */
export function createDenoKvDeleteResultFailure(
  params: {
    error: DenoKvFailureError;
    duration: number;
  },
): DenoKvDeleteResultFailure {
  return {
    kind: "deno-kv:delete",
    processed: false,
    ok: false,
    error: params.error,
    duration: params.duration,
  };
}

/**
 * Create a successful list result.
 */
export function createDenoKvListResultSuccess<T>(
  params: {
    entries: readonly DenoKvEntry<T>[];
    duration: number;
  },
): DenoKvListResultSuccess<T> {
  return {
    kind: "deno-kv:list",
    processed: true,
    ok: true,
    error: null,
    entries: params.entries,
    duration: params.duration,
  };
}

/**
 * Create a list result with KV error.
 */
export function createDenoKvListResultError<T>(
  params: {
    error: DenoKvError;
    duration: number;
  },
): DenoKvListResultError<T> {
  return {
    kind: "deno-kv:list",
    processed: true,
    ok: false,
    error: params.error,
    entries: [],
    duration: params.duration,
  };
}

/**
 * Create a list result with connection failure.
 */
export function createDenoKvListResultFailure<T>(
  params: {
    error: DenoKvFailureError;
    duration: number;
  },
): DenoKvListResultFailure<T> {
  return {
    kind: "deno-kv:list",
    processed: false,
    ok: false,
    error: params.error,
    entries: [],
    duration: params.duration,
  };
}

/**
 * Create a committed atomic result.
 */
export function createDenoKvAtomicResultCommitted(
  params: {
    versionstamp: string;
    duration: number;
  },
): DenoKvAtomicResultCommitted {
  return {
    kind: "deno-kv:atomic",
    processed: true,
    ok: true,
    error: null,
    versionstamp: params.versionstamp,
    duration: params.duration,
  };
}

/**
 * Create an atomic result for check failure.
 */
export function createDenoKvAtomicResultCheckFailed(
  params: {
    duration: number;
  },
): DenoKvAtomicResultCheckFailed {
  return {
    kind: "deno-kv:atomic",
    processed: true,
    ok: false,
    error: null,
    versionstamp: null,
    duration: params.duration,
  };
}

/**
 * Create an atomic result with KV error.
 */
export function createDenoKvAtomicResultError(
  params: {
    error: DenoKvError;
    duration: number;
  },
): DenoKvAtomicResultError {
  return {
    kind: "deno-kv:atomic",
    processed: true,
    ok: false,
    error: params.error,
    versionstamp: null,
    duration: params.duration,
  };
}

/**
 * Create an atomic result with connection failure.
 */
export function createDenoKvAtomicResultFailure(
  params: {
    error: DenoKvFailureError;
    duration: number;
  },
): DenoKvAtomicResultFailure {
  return {
    kind: "deno-kv:atomic",
    processed: false,
    ok: false,
    error: params.error,
    versionstamp: null,
    duration: params.duration,
  };
}

// ============================================================================
// Union Types
// ============================================================================

/**
 * Union of all Deno KV result types.
 */
// deno-lint-ignore no-explicit-any
export type DenoKvResult<T = any> =
  | DenoKvGetResult<T>
  | DenoKvSetResult
  | DenoKvDeleteResult
  | DenoKvListResult<T>
  | DenoKvAtomicResult;
