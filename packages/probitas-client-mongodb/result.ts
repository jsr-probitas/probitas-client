import type { ClientResult } from "@probitas/client";
import type { Document } from "./types.ts";
import { MongoError, type MongoFailureError } from "./errors.ts";

// ============================================================================
// MongoFindResult
// ============================================================================

/**
 * Base interface for find result with common fields.
 */
interface MongoFindResultBase<T> extends ClientResult {
  readonly kind: "mongo:find";
  readonly docs: readonly T[] | null;
}

/**
 * Successful find result.
 */
export interface MongoFindResultSuccess<T = Document>
  extends MongoFindResultBase<T> {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly docs: readonly T[];
}

/**
 * Find result with MongoDB error.
 */
export interface MongoFindResultError<T = Document>
  extends MongoFindResultBase<T> {
  readonly processed: true;
  readonly ok: false;
  readonly error: MongoError;
  readonly docs: readonly T[];
}

/**
 * Find result with connection failure.
 */
export interface MongoFindResultFailure<T = Document>
  extends MongoFindResultBase<T> {
  readonly processed: false;
  readonly ok: false;
  readonly error: MongoFailureError;
  readonly docs: null;
}

/**
 * Query result (find, aggregate).
 */
export type MongoFindResult<T = Document> =
  | MongoFindResultSuccess<T>
  | MongoFindResultError<T>
  | MongoFindResultFailure<T>;

// ============================================================================
// MongoFindOneResult
// ============================================================================

/**
 * Base interface for findOne result with common fields.
 */
interface MongoFindOneResultBase<T> extends ClientResult {
  readonly kind: "mongo:find-one";
  readonly doc: T | null;
}

/**
 * Successful findOne result.
 */
export interface MongoFindOneResultSuccess<T = Document>
  extends MongoFindOneResultBase<T> {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly doc: T | null;
}

/**
 * FindOne result with MongoDB error.
 */
export interface MongoFindOneResultError<T = Document>
  extends MongoFindOneResultBase<T> {
  readonly processed: true;
  readonly ok: false;
  readonly error: MongoError;
  readonly doc: null;
}

/**
 * FindOne result with connection failure.
 */
export interface MongoFindOneResultFailure<T = Document>
  extends MongoFindOneResultBase<T> {
  readonly processed: false;
  readonly ok: false;
  readonly error: MongoFailureError;
  readonly doc: null;
}

/**
 * FindOne result.
 */
export type MongoFindOneResult<T = Document> =
  | MongoFindOneResultSuccess<T>
  | MongoFindOneResultError<T>
  | MongoFindOneResultFailure<T>;

// ============================================================================
// MongoInsertOneResult
// ============================================================================

/**
 * Base interface for insertOne result with common fields.
 */
interface MongoInsertOneResultBase extends ClientResult {
  readonly kind: "mongo:insert-one";
  readonly insertedId: string | null;
}

/**
 * Successful insertOne result.
 */
export interface MongoInsertOneResultSuccess extends MongoInsertOneResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly insertedId: string;
}

/**
 * InsertOne result with MongoDB error.
 */
export interface MongoInsertOneResultError extends MongoInsertOneResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: MongoError;
  readonly insertedId: null;
}

/**
 * InsertOne result with connection failure.
 */
export interface MongoInsertOneResultFailure extends MongoInsertOneResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: MongoFailureError;
  readonly insertedId: null;
}

/**
 * Insert one result.
 */
export type MongoInsertOneResult =
  | MongoInsertOneResultSuccess
  | MongoInsertOneResultError
  | MongoInsertOneResultFailure;

// ============================================================================
// MongoInsertManyResult
// ============================================================================

/**
 * Base interface for insertMany result with common fields.
 */
interface MongoInsertManyResultBase extends ClientResult {
  readonly kind: "mongo:insert-many";
  readonly insertedIds: readonly string[] | null;
  readonly insertedCount: number | null;
}

/**
 * Successful insertMany result.
 */
export interface MongoInsertManyResultSuccess
  extends MongoInsertManyResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly insertedIds: readonly string[];
  readonly insertedCount: number;
}

/**
 * InsertMany result with MongoDB error.
 */
export interface MongoInsertManyResultError extends MongoInsertManyResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: MongoError;
  readonly insertedIds: null;
  readonly insertedCount: null;
}

/**
 * InsertMany result with connection failure.
 */
export interface MongoInsertManyResultFailure
  extends MongoInsertManyResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: MongoFailureError;
  readonly insertedIds: null;
  readonly insertedCount: null;
}

/**
 * Insert many result.
 */
export type MongoInsertManyResult =
  | MongoInsertManyResultSuccess
  | MongoInsertManyResultError
  | MongoInsertManyResultFailure;

// ============================================================================
// MongoUpdateResult
// ============================================================================

/**
 * Base interface for update result with common fields.
 */
interface MongoUpdateResultBase extends ClientResult {
  readonly kind: "mongo:update";
  readonly matchedCount: number | null;
  readonly modifiedCount: number | null;
  readonly upsertedId?: string | null;
}

/**
 * Successful update result.
 */
export interface MongoUpdateResultSuccess extends MongoUpdateResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly matchedCount: number;
  readonly modifiedCount: number;
  readonly upsertedId?: string;
}

/**
 * Update result with MongoDB error.
 */
export interface MongoUpdateResultError extends MongoUpdateResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: MongoError;
  readonly matchedCount: null;
  readonly modifiedCount: null;
  readonly upsertedId: null;
}

/**
 * Update result with connection failure.
 */
export interface MongoUpdateResultFailure extends MongoUpdateResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: MongoFailureError;
  readonly matchedCount: null;
  readonly modifiedCount: null;
  readonly upsertedId: null;
}

/**
 * Update result.
 */
export type MongoUpdateResult =
  | MongoUpdateResultSuccess
  | MongoUpdateResultError
  | MongoUpdateResultFailure;

// ============================================================================
// MongoDeleteResult
// ============================================================================

/**
 * Base interface for delete result with common fields.
 */
interface MongoDeleteResultBase extends ClientResult {
  readonly kind: "mongo:delete";
  readonly deletedCount: number | null;
}

/**
 * Successful delete result.
 */
export interface MongoDeleteResultSuccess extends MongoDeleteResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly deletedCount: number;
}

/**
 * Delete result with MongoDB error.
 */
export interface MongoDeleteResultError extends MongoDeleteResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: MongoError;
  readonly deletedCount: null;
}

/**
 * Delete result with connection failure.
 */
export interface MongoDeleteResultFailure extends MongoDeleteResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: MongoFailureError;
  readonly deletedCount: null;
}

/**
 * Delete result.
 */
export type MongoDeleteResult =
  | MongoDeleteResultSuccess
  | MongoDeleteResultError
  | MongoDeleteResultFailure;

// ============================================================================
// MongoCountResult
// ============================================================================

/**
 * Base interface for count result with common fields.
 */
interface MongoCountResultBase extends ClientResult {
  readonly kind: "mongo:count";
  readonly count: number | null;
}

/**
 * Successful count result.
 */
export interface MongoCountResultSuccess extends MongoCountResultBase {
  readonly processed: true;
  readonly ok: true;
  readonly error: null;
  readonly count: number;
}

/**
 * Count result with MongoDB error.
 */
export interface MongoCountResultError extends MongoCountResultBase {
  readonly processed: true;
  readonly ok: false;
  readonly error: MongoError;
  readonly count: null;
}

/**
 * Count result with connection failure.
 */
export interface MongoCountResultFailure extends MongoCountResultBase {
  readonly processed: false;
  readonly ok: false;
  readonly error: MongoFailureError;
  readonly count: null;
}

/**
 * Count result.
 */
export type MongoCountResult =
  | MongoCountResultSuccess
  | MongoCountResultError
  | MongoCountResultFailure;

// ============================================================================
// Union Type
// ============================================================================

/**
 * Union of all MongoDB result types.
 */
// deno-lint-ignore no-explicit-any
export type MongoResult<T = any> =
  | MongoFindResult<T>
  | MongoInsertOneResult
  | MongoInsertManyResult
  | MongoUpdateResult
  | MongoDeleteResult
  | MongoFindOneResult<T>
  | MongoCountResult;

// ============================================================================
// MongoFindResult Factory Functions
// ============================================================================

/**
 * Create a successful find result.
 */
export function createMongoFindResultSuccess<T>(params: {
  docs: readonly T[];
  duration: number;
}): MongoFindResultSuccess<T> {
  return {
    kind: "mongo:find",
    processed: true,
    ok: true,
    error: null,
    docs: params.docs,
    duration: params.duration,
  };
}

/**
 * Create an error find result.
 */
export function createMongoFindResultError<T>(params: {
  error: MongoError;
  duration: number;
}): MongoFindResultError<T> {
  return {
    kind: "mongo:find",
    processed: true,
    ok: false,
    error: params.error,
    docs: [],
    duration: params.duration,
  };
}

/**
 * Create a failure find result.
 */
export function createMongoFindResultFailure<T>(params: {
  error: MongoFailureError;
  duration: number;
}): MongoFindResultFailure<T> {
  return {
    kind: "mongo:find",
    processed: false,
    ok: false,
    error: params.error,
    docs: null,
    duration: params.duration,
  };
}

// ============================================================================
// MongoFindOneResult Factory Functions
// ============================================================================

/**
 * Create a successful findOne result.
 */
export function createMongoFindOneResultSuccess<T>(params: {
  doc: T | null;
  duration: number;
}): MongoFindOneResultSuccess<T> {
  return {
    kind: "mongo:find-one",
    processed: true,
    ok: true,
    error: null,
    doc: params.doc,
    duration: params.duration,
  };
}

/**
 * Create an error findOne result.
 */
export function createMongoFindOneResultError<T>(params: {
  error: MongoError;
  duration: number;
}): MongoFindOneResultError<T> {
  return {
    kind: "mongo:find-one",
    processed: true,
    ok: false,
    error: params.error,
    doc: null,
    duration: params.duration,
  };
}

/**
 * Create a failure findOne result.
 */
export function createMongoFindOneResultFailure<T>(params: {
  error: MongoFailureError;
  duration: number;
}): MongoFindOneResultFailure<T> {
  return {
    kind: "mongo:find-one",
    processed: false,
    ok: false,
    error: params.error,
    doc: null,
    duration: params.duration,
  };
}

// ============================================================================
// MongoInsertOneResult Factory Functions
// ============================================================================

/**
 * Create a successful insertOne result.
 */
export function createMongoInsertOneResultSuccess(params: {
  insertedId: string;
  duration: number;
}): MongoInsertOneResultSuccess {
  return {
    kind: "mongo:insert-one",
    processed: true,
    ok: true,
    error: null,
    insertedId: params.insertedId,
    duration: params.duration,
  };
}

/**
 * Create an error insertOne result.
 */
export function createMongoInsertOneResultError(params: {
  error: MongoError;
  duration: number;
}): MongoInsertOneResultError {
  return {
    kind: "mongo:insert-one",
    processed: true,
    ok: false,
    error: params.error,
    insertedId: null,
    duration: params.duration,
  };
}

/**
 * Create a failure insertOne result.
 */
export function createMongoInsertOneResultFailure(params: {
  error: MongoFailureError;
  duration: number;
}): MongoInsertOneResultFailure {
  return {
    kind: "mongo:insert-one",
    processed: false,
    ok: false,
    error: params.error,
    insertedId: null,
    duration: params.duration,
  };
}

// ============================================================================
// MongoInsertManyResult Factory Functions
// ============================================================================

/**
 * Create a successful insertMany result.
 */
export function createMongoInsertManyResultSuccess(params: {
  insertedIds: readonly string[];
  insertedCount: number;
  duration: number;
}): MongoInsertManyResultSuccess {
  return {
    kind: "mongo:insert-many",
    processed: true,
    ok: true,
    error: null,
    insertedIds: params.insertedIds,
    insertedCount: params.insertedCount,
    duration: params.duration,
  };
}

/**
 * Create an error insertMany result.
 */
export function createMongoInsertManyResultError(params: {
  error: MongoError;
  duration: number;
}): MongoInsertManyResultError {
  return {
    kind: "mongo:insert-many",
    processed: true,
    ok: false,
    error: params.error,
    insertedIds: null,
    insertedCount: null,
    duration: params.duration,
  };
}

/**
 * Create a failure insertMany result.
 */
export function createMongoInsertManyResultFailure(params: {
  error: MongoFailureError;
  duration: number;
}): MongoInsertManyResultFailure {
  return {
    kind: "mongo:insert-many",
    processed: false,
    ok: false,
    error: params.error,
    insertedIds: null,
    insertedCount: null,
    duration: params.duration,
  };
}

// ============================================================================
// MongoUpdateResult Factory Functions
// ============================================================================

/**
 * Create a successful update result.
 */
export function createMongoUpdateResultSuccess(params: {
  matchedCount: number;
  modifiedCount: number;
  upsertedId?: string;
  duration: number;
}): MongoUpdateResultSuccess {
  return {
    kind: "mongo:update",
    processed: true,
    ok: true,
    error: null,
    matchedCount: params.matchedCount,
    modifiedCount: params.modifiedCount,
    upsertedId: params.upsertedId,
    duration: params.duration,
  };
}

/**
 * Create an error update result.
 */
export function createMongoUpdateResultError(params: {
  error: MongoError;
  duration: number;
}): MongoUpdateResultError {
  return {
    kind: "mongo:update",
    processed: true,
    ok: false,
    error: params.error,
    matchedCount: null,
    modifiedCount: null,
    upsertedId: null,
    duration: params.duration,
  };
}

/**
 * Create a failure update result.
 */
export function createMongoUpdateResultFailure(params: {
  error: MongoFailureError;
  duration: number;
}): MongoUpdateResultFailure {
  return {
    kind: "mongo:update",
    processed: false,
    ok: false,
    error: params.error,
    matchedCount: null,
    modifiedCount: null,
    upsertedId: null,
    duration: params.duration,
  };
}

// ============================================================================
// MongoDeleteResult Factory Functions
// ============================================================================

/**
 * Create a successful delete result.
 */
export function createMongoDeleteResultSuccess(params: {
  deletedCount: number;
  duration: number;
}): MongoDeleteResultSuccess {
  return {
    kind: "mongo:delete",
    processed: true,
    ok: true,
    error: null,
    deletedCount: params.deletedCount,
    duration: params.duration,
  };
}

/**
 * Create an error delete result.
 */
export function createMongoDeleteResultError(params: {
  error: MongoError;
  duration: number;
}): MongoDeleteResultError {
  return {
    kind: "mongo:delete",
    processed: true,
    ok: false,
    error: params.error,
    deletedCount: null,
    duration: params.duration,
  };
}

/**
 * Create a failure delete result.
 */
export function createMongoDeleteResultFailure(params: {
  error: MongoFailureError;
  duration: number;
}): MongoDeleteResultFailure {
  return {
    kind: "mongo:delete",
    processed: false,
    ok: false,
    error: params.error,
    deletedCount: null,
    duration: params.duration,
  };
}

// ============================================================================
// MongoCountResult Factory Functions
// ============================================================================

/**
 * Create a successful count result.
 */
export function createMongoCountResultSuccess(params: {
  count: number;
  duration: number;
}): MongoCountResultSuccess {
  return {
    kind: "mongo:count",
    processed: true,
    ok: true,
    error: null,
    count: params.count,
    duration: params.duration,
  };
}

/**
 * Create an error count result.
 */
export function createMongoCountResultError(params: {
  error: MongoError;
  duration: number;
}): MongoCountResultError {
  return {
    kind: "mongo:count",
    processed: true,
    ok: false,
    error: params.error,
    count: null,
    duration: params.duration,
  };
}

/**
 * Create a failure count result.
 */
export function createMongoCountResultFailure(params: {
  error: MongoFailureError;
  duration: number;
}): MongoCountResultFailure {
  return {
    kind: "mongo:count",
    processed: false,
    ok: false,
    error: params.error,
    count: null,
    duration: params.duration,
  };
}
