# @probitas/client-mongodb

MongoDB client package.

**Depends on**: `@probitas/client`

## MongoResult Types

```typescript
/**
 * Document array with convenience helpers.
 */
interface MongoDocs<T> extends ReadonlyArray<T> {
  first(): T | undefined;
  firstOrThrow(): T;
  last(): T | undefined;
  lastOrThrow(): T;
}

/**
 * Query result (find, aggregate).
 */
interface MongoFindResult<T = Document> {
  readonly ok: boolean;
  readonly docs: MongoDocs<T>;
  readonly duration: number;
}

/**
 * Insert results.
 */
interface MongoInsertOneResult {
  readonly ok: boolean;
  readonly insertedId: string;
  readonly duration: number;
}

interface MongoInsertManyResult {
  readonly ok: boolean;
  readonly insertedIds: readonly string[];
  readonly insertedCount: number;
  readonly duration: number;
}

/**
 * Update result.
 */
interface MongoUpdateResult {
  readonly ok: boolean;
  readonly matchedCount: number;
  readonly modifiedCount: number;
  readonly upsertedId?: string;
  readonly duration: number;
}

/**
 * Delete result.
 */
interface MongoDeleteResult {
  readonly ok: boolean;
  readonly deletedCount: number;
  readonly duration: number;
}
```

## MongoError

```typescript
class MongoError extends ClientError {
  readonly code?: number;
}

class MongoDuplicateKeyError extends MongoError {
  readonly keyPattern: Record<string, number>;
  readonly keyValue: Record<string, unknown>;
}

class MongoValidationError extends MongoError {
  readonly validationErrors: readonly string[];
}

class MongoWriteError extends MongoError {
  readonly writeErrors: readonly {
    index: number;
    code: number;
    message: string;
  }[];
}
```

## Expectation Helpers

```typescript
interface MongoFindResultExpectation<T> {
  // --- Status ---
  ok(): this;
  notOk(): this;

  // --- Count ---
  noContent(): this;
  hasContent(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;

  // --- Document assertions ---
  dataContains(subset: Partial<T>): this;
  dataMatch(matcher: (docs: MongoDocs<T>) => void): this;

  // --- Performance ---
  durationLessThan(ms: number): this;
}

function expectMongoFindResult<T = Document>(
  result: MongoFindResult<T>,
): MongoFindResultExpectation<T>;

interface MongoInsertResultExpectation {
  ok(): this;
  notOk(): this;
  insertedCount(count: number): this;
  hasInsertedId(): this;
  durationLessThan(ms: number): this;
}

function expectMongoInsertResult(
  result: MongoInsertOneResult | MongoInsertManyResult,
): MongoInsertResultExpectation;

interface MongoUpdateResultExpectation {
  ok(): this;
  notOk(): this;
  matchedCount(count: number): this;
  modifiedCount(count: number): this;
  hasUpsertedId(): this;
  durationLessThan(ms: number): this;
}

function expectMongoUpdateResult(
  result: MongoUpdateResult,
): MongoUpdateResultExpectation;

interface MongoDeleteResultExpectation {
  ok(): this;
  notOk(): this;
  deletedCount(count: number): this;
  deletedAtLeast(count: number): this;
  durationLessThan(ms: number): this;
}

function expectMongoDeleteResult(
  result: MongoDeleteResult,
): MongoDeleteResultExpectation;

interface MongoFindOneResultExpectation<T> {
  ok(): this;
  notOk(): this;
  hasContent(): this;
  noContent(): this;
  dataContains(subset: Partial<T>): this;
  dataMatch(matcher: (doc: T) => void): this;
  durationLessThan(ms: number): this;
}

function expectMongoFindOneResult<T = Document>(
  result: MongoFindOneResult<T>,
): MongoFindOneResultExpectation<T>;

interface MongoCountResultExpectation {
  ok(): this;
  notOk(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;
  countBetween(min: number, max: number): this;
  isEmpty(): this;
  isNotEmpty(): this;
  durationLessThan(ms: number): this;
}

function expectMongoCountResult(
  result: MongoCountResult,
): MongoCountResultExpectation;
function expectMongoResult(result: MongoResult); // returns the expectation matching result.type
```

## MongoClient

```typescript
interface MongoConnectionConfig extends CommonConnectionConfig {
  readonly database?: string;
  readonly authSource?: string;
  readonly replicaSet?: string;
}

interface MongoClientConfig extends CommonOptions {
  readonly url: string | MongoConnectionConfig;
  readonly database: string;
}

interface MongoClient extends AsyncDisposable {
  readonly config: MongoClientConfig;

  collection<T extends Document = Document>(name: string): MongoCollection<T>;
  db(name: string): MongoClient;
  transaction<T>(fn: (session: MongoSession) => Promise<T>): Promise<T>;

  close(): Promise<void>;
}

interface MongoCollection<T extends Document> {
  find(
    filter?: Filter<T>,
    options?: MongoFindOptions,
  ): Promise<MongoFindResult<T>>;
  findOne(filter: Filter<T>, options?: CommonOptions): Promise<T | undefined>;
  insertOne(
    doc: Omit<T, "_id">,
    options?: CommonOptions,
  ): Promise<MongoInsertOneResult>;
  insertMany(
    docs: Omit<T, "_id">[],
    options?: CommonOptions,
  ): Promise<MongoInsertManyResult>;
  updateOne(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: MongoUpdateOptions,
  ): Promise<MongoUpdateResult>;
  updateMany(
    filter: Filter<T>,
    update: UpdateFilter<T>,
    options?: MongoUpdateOptions,
  ): Promise<MongoUpdateResult>;
  deleteOne(
    filter: Filter<T>,
    options?: CommonOptions,
  ): Promise<MongoDeleteResult>;
  deleteMany(
    filter: Filter<T>,
    options?: CommonOptions,
  ): Promise<MongoDeleteResult>;
  aggregate<R = T>(
    pipeline: Document[],
    options?: CommonOptions,
  ): Promise<MongoFindResult<R>>;
  countDocuments(filter?: Filter<T>, options?: CommonOptions): Promise<number>;
}

interface MongoFindOptions extends CommonOptions {
  readonly sort?: Record<string, 1 | -1>;
  readonly limit?: number;
  readonly skip?: number;
  readonly projection?: Record<string, 0 | 1>;
}

interface MongoUpdateOptions extends CommonOptions {
  readonly upsert?: boolean;
}

interface MongoSession {
  collection<T extends Document = Document>(name: string): MongoCollection<T>;
}

function createMongoClient(config: MongoClientConfig): Promise<MongoClient>;
```

## Example

```typescript
import {
  createMongoClient,
  expectMongoFindResult,
  expectMongoInsertResult,
} from "@probitas/client-mongodb";

const mongo = await createMongoClient({
  url: "mongodb://localhost:27017",
  database: "testdb",
});

const users = mongo.collection<{ name: string; age: number }>("users");

// Insert
const insertResult = await users.insertOne({ name: "Alice", age: 30 });
expectMongoInsertResult(insertResult).ok().hasInsertedId();

// Find
const findResult = await users.find({ age: { $gte: 18 } });
expectMongoFindResult(findResult).ok().hasContent();
const firstUser = findResult.docs.firstOrThrow();

// Transaction
await mongo.transaction(async (session) => {
  await session.collection("logs").insertOne({ message: "user created" });
});

await mongo.close();
```
