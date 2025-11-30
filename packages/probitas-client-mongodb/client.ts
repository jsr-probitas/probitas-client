import { MongoClient as NativeMongoClient } from "mongodb";
import type {
  ClientSession,
  Collection as NativeCollection,
  Db,
  MongoClientOptions,
} from "mongodb";
import { AbortError, TimeoutError } from "@probitas/client";
import type { CommonOptions } from "@probitas/client";
import type {
  Document,
  Filter,
  MongoClient,
  MongoClientConfig,
  MongoCollection,
  MongoDeleteResult,
  MongoFindOptions,
  MongoFindResult,
  MongoInsertManyResult,
  MongoInsertOneResult,
  MongoSession,
  MongoUpdateOptions,
  MongoUpdateResult,
  UpdateFilter,
} from "./types.ts";
import {
  MongoConnectionError,
  MongoDuplicateKeyError,
  MongoQueryError,
  MongoWriteError,
} from "./errors.ts";
import { createMongoDocs } from "./results.ts";

/**
 * Execute a promise with timeout and abort signal support.
 */
async function withOptions<T>(
  promise: Promise<T>,
  options: CommonOptions | undefined,
  operation: string,
): Promise<T> {
  if (!options?.timeout && !options?.signal) {
    return promise;
  }

  const controllers: { cleanup: () => void }[] = [];

  try {
    const racePromises: Promise<T>[] = [promise];

    if (options.timeout !== undefined) {
      const timeoutMs = options.timeout;
      let timeoutId: number;
      const timeoutPromise = new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(
            new TimeoutError(`Operation timed out: ${operation}`, timeoutMs),
          );
        }, timeoutMs);
      });
      controllers.push({ cleanup: () => clearTimeout(timeoutId) });
      racePromises.push(timeoutPromise);
    }

    if (options.signal) {
      const signal = options.signal;
      if (signal.aborted) {
        throw new AbortError(`Operation aborted: ${operation}`);
      }

      const abortPromise = new Promise<never>((_, reject) => {
        const onAbort = () => {
          reject(new AbortError(`Operation aborted: ${operation}`));
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
 * Convert MongoDB error to appropriate error type.
 */
function convertMongoError(
  error: unknown,
  collection: string,
): never {
  if (error instanceof TimeoutError || error instanceof AbortError) {
    throw error;
  }

  if (error instanceof Error) {
    // deno-lint-ignore no-explicit-any
    const mongoError = error as any;

    // Duplicate key error (code 11000)
    if (mongoError.code === 11000) {
      throw new MongoDuplicateKeyError(
        error.message,
        mongoError.keyPattern ?? {},
        mongoError.keyValue ?? {},
        { cause: error, code: 11000 },
      );
    }

    // Write errors
    if (mongoError.writeErrors?.length > 0) {
      throw new MongoWriteError(
        error.message,
        mongoError.writeErrors.map((
          e: { index: number; code: number; errmsg: string },
        ) => ({
          index: e.index,
          code: e.code,
          message: e.errmsg,
        })),
        { cause: error, code: mongoError.code },
      );
    }

    throw new MongoQueryError(error.message, collection, {
      cause: error,
      code: mongoError.code,
    });
  }

  throw new MongoQueryError(String(error), collection);
}

/**
 * Create a MongoDB client.
 *
 * @example
 * ```typescript
 * const mongo = await createMongoClient({
 *   uri: "mongodb://localhost:27017",
 *   database: "testdb",
 * });
 *
 * const users = mongo.collection<{ name: string; age: number }>("users");
 * const result = await users.find({ age: { $gte: 18 } });
 * console.log(result.docs.first());
 *
 * await mongo.close();
 * ```
 */
export async function createMongoClient(
  config: MongoClientConfig,
): Promise<MongoClient> {
  let client: NativeMongoClient;

  try {
    // MongoClientOptions type requires many properties that are optional at runtime
    const options = {
      connectTimeoutMS: config.timeout ?? 10000,
      serverSelectionTimeoutMS: config.timeout ?? 10000,
    } as MongoClientOptions;
    client = new NativeMongoClient(config.uri, options);

    await client.connect();
  } catch (error) {
    throw new MongoConnectionError(
      `Failed to connect to MongoDB: ${
        error instanceof Error ? error.message : String(error)
      }`,
      { cause: error instanceof Error ? error : undefined },
    );
  }

  return new MongoClientImpl(config, client, client.db(config.database));
}

class MongoClientImpl implements MongoClient {
  readonly config: MongoClientConfig;
  readonly #client: NativeMongoClient;
  readonly #db: Db;
  #closed = false;

  constructor(config: MongoClientConfig, client: NativeMongoClient, db: Db) {
    this.config = config;
    this.#client = client;
    this.#db = db;
  }

  collection<T extends Document = Document>(name: string): MongoCollection<T> {
    this.#ensureOpen();
    return new MongoCollectionImpl<T>(this.#db.collection(name), name);
  }

  db(name: string): MongoClient {
    this.#ensureOpen();
    return new MongoClientImpl(
      { ...this.config, database: name },
      this.#client,
      this.#client.db(name),
    );
  }

  async transaction<T>(fn: (session: MongoSession) => Promise<T>): Promise<T> {
    this.#ensureOpen();
    const session = this.#client.startSession();

    try {
      return await session.withTransaction(async () => {
        const mongoSession = new MongoSessionImpl(this.#db, session);
        return await fn(mongoSession);
      });
    } finally {
      await session.endSession();
    }
  }

  async close(): Promise<void> {
    if (this.#closed) return;
    this.#closed = true;
    await this.#client.close();
  }

  [Symbol.asyncDispose](): Promise<void> {
    return this.close();
  }

  #ensureOpen(): void {
    if (this.#closed) {
      throw new MongoConnectionError("Client is closed");
    }
  }
}

class MongoSessionImpl implements MongoSession {
  readonly #db: Db;
  readonly #session: ClientSession;

  constructor(db: Db, session: ClientSession) {
    this.#db = db;
    this.#session = session;
  }

  collection<T extends Document = Document>(name: string): MongoCollection<T> {
    return new MongoCollectionImpl<T>(
      this.#db.collection(name),
      name,
      this.#session,
    );
  }
}

class MongoCollectionImpl<T extends Document> implements MongoCollection<T> {
  readonly #collection: NativeCollection;
  readonly #name: string;
  readonly #session?: ClientSession;

  constructor(
    collection: NativeCollection,
    name: string,
    session?: ClientSession,
  ) {
    this.#collection = collection;
    this.#name = name;
    this.#session = session;
  }

  async find(
    filter: Filter<T> = {},
    options?: MongoFindOptions,
  ): Promise<MongoFindResult<T>> {
    const startTime = performance.now();
    const operation = `find(${this.#name})`;

    try {
      const findOptions: Record<string, unknown> = {};
      if (options?.sort) findOptions.sort = options.sort;
      if (options?.limit) findOptions.limit = options.limit;
      if (options?.skip) findOptions.skip = options.skip;
      if (options?.projection) findOptions.projection = options.projection;
      if (this.#session) findOptions.session = this.#session;

      const cursor = this.#collection.find(filter, findOptions);
      const docsPromise = cursor.toArray();
      const docs = await withOptions(
        docsPromise,
        options,
        operation,
      ) as unknown as T[];

      return {
        ok: true,
        docs: createMongoDocs(docs),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async findOne(
    filter: Filter<T>,
    options?: CommonOptions,
  ): Promise<T | undefined> {
    const operation = `findOne(${this.#name})`;

    try {
      const findOptions: Record<string, unknown> = {};
      if (this.#session) findOptions.session = this.#session;

      const promise = this.#collection.findOne(filter, findOptions);
      const doc = await withOptions(promise, options, operation);
      return (doc ?? undefined) as T | undefined;
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async insertOne(
    doc: Omit<T, "_id">,
    options?: CommonOptions,
  ): Promise<MongoInsertOneResult> {
    const startTime = performance.now();
    const operation = `insertOne(${this.#name})`;

    try {
      const insertOptions: Record<string, unknown> = {};
      if (this.#session) insertOptions.session = this.#session;

      const promise = this.#collection.insertOne(doc, insertOptions);
      const result = await withOptions(promise, options, operation);

      return {
        ok: result.acknowledged,
        insertedId: String(result.insertedId),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async insertMany(
    docs: Omit<T, "_id">[],
    options?: CommonOptions,
  ): Promise<MongoInsertManyResult> {
    const startTime = performance.now();
    const operation = `insertMany(${this.#name})`;

    try {
      const insertOptions: Record<string, unknown> = {};
      if (this.#session) insertOptions.session = this.#session;

      const promise = this.#collection.insertMany(docs, insertOptions);
      const result = await withOptions(promise, options, operation);

      return {
        ok: result.acknowledged,
        insertedIds: Object.values(result.insertedIds).map(String),
        insertedCount: result.insertedCount,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: MongoUpdateOptions,
  ): Promise<MongoUpdateResult> {
    const startTime = performance.now();
    const operation = `updateOne(${this.#name})`;

    try {
      const updateOptions: Record<string, unknown> = {};
      if (options?.upsert) updateOptions.upsert = true;
      if (this.#session) updateOptions.session = this.#session;

      const promise = this.#collection.updateOne(filter, update, updateOptions);
      const result = await withOptions(promise, options, operation);

      return {
        ok: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId ? String(result.upsertedId) : undefined,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async updateMany(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: MongoUpdateOptions,
  ): Promise<MongoUpdateResult> {
    const startTime = performance.now();
    const operation = `updateMany(${this.#name})`;

    try {
      const updateOptions: Record<string, unknown> = {};
      if (options?.upsert) updateOptions.upsert = true;
      if (this.#session) updateOptions.session = this.#session;

      const promise = this.#collection.updateMany(
        filter,
        update,
        updateOptions,
      );
      const result = await withOptions(promise, options, operation);

      return {
        ok: result.acknowledged,
        matchedCount: result.matchedCount,
        modifiedCount: result.modifiedCount,
        upsertedId: result.upsertedId ? String(result.upsertedId) : undefined,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async deleteOne(
    filter: Filter<T>,
    options?: CommonOptions,
  ): Promise<MongoDeleteResult> {
    const startTime = performance.now();
    const operation = `deleteOne(${this.#name})`;

    try {
      const deleteOptions: Record<string, unknown> = {};
      if (this.#session) deleteOptions.session = this.#session;

      const promise = this.#collection.deleteOne(filter, deleteOptions);
      const result = await withOptions(promise, options, operation);

      return {
        ok: result.acknowledged,
        deletedCount: result.deletedCount,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async deleteMany(
    filter: Filter<T>,
    options?: CommonOptions,
  ): Promise<MongoDeleteResult> {
    const startTime = performance.now();
    const operation = `deleteMany(${this.#name})`;

    try {
      const deleteOptions: Record<string, unknown> = {};
      if (this.#session) deleteOptions.session = this.#session;

      const promise = this.#collection.deleteMany(filter, deleteOptions);
      const result = await withOptions(promise, options, operation);

      return {
        ok: result.acknowledged,
        deletedCount: result.deletedCount,
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async aggregate<R = T>(
    pipeline: Document[],
    options?: CommonOptions,
  ): Promise<MongoFindResult<R>> {
    const startTime = performance.now();
    const operation = `aggregate(${this.#name})`;

    try {
      const aggOptions: Record<string, unknown> = {};
      if (this.#session) aggOptions.session = this.#session;

      const cursor = this.#collection.aggregate(pipeline, aggOptions);
      const docsPromise = cursor.toArray();
      const docs = await withOptions(docsPromise, options, operation) as R[];

      return {
        ok: true,
        docs: createMongoDocs(docs),
        duration: performance.now() - startTime,
      };
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }

  async countDocuments(
    filter: Filter<T> = {},
    options?: CommonOptions,
  ): Promise<number> {
    const operation = `countDocuments(${this.#name})`;

    try {
      const countOptions: Record<string, unknown> = {};
      if (this.#session) countOptions.session = this.#session;

      const promise = this.#collection.countDocuments(filter, countOptions);
      return await withOptions(promise, options, operation);
    } catch (error) {
      convertMongoError(error, this.#name);
    }
  }
}
