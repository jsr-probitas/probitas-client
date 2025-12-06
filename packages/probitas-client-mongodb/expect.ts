import { containsSubset } from "@probitas/client";
import type {
  MongoDeleteResult,
  MongoDocs,
  MongoFindResult,
  MongoInsertManyResult,
  MongoInsertOneResult,
  MongoUpdateResult,
} from "./types.ts";

/**
 * Fluent API for MongoDB find result validation.
 */
export interface MongoFindResultExpectation<T> {
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  docs(count: number): this;
  docsAtLeast(count: number): this;
  docsAtMost(count: number): this;
  docContains(subset: Partial<T>): this;
  docMatch(matcher: (docs: MongoDocs<T>) => void): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB insert result validation.
 */
export interface MongoInsertResultExpectation {
  ok(): this;
  notOk(): this;
  insertedCount(count: number): this;
  hasInsertedId(): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB update result validation.
 */
export interface MongoUpdateResultExpectation {
  ok(): this;
  notOk(): this;
  matchedCount(count: number): this;
  modifiedCount(count: number): this;
  wasUpserted(): this;
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for MongoDB delete result validation.
 */
export interface MongoDeleteResultExpectation {
  ok(): this;
  notOk(): this;
  deletedCount(count: number): this;
  deletedAtLeast(count: number): this;
  durationLessThan(ms: number): this;
}

class MongoFindResultExpectationImpl<T>
  implements MongoFindResultExpectation<T> {
  readonly #result: MongoFindResult<T>;

  constructor(result: MongoFindResult<T>) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  noContent(): this {
    if (this.#result.docs.length !== 0) {
      throw new Error(
        `Expected no documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  hasContent(): this {
    if (this.#result.docs.length === 0) {
      throw new Error("Expected documents, but got none");
    }
    return this;
  }

  docs(count: number): this {
    if (this.#result.docs.length !== count) {
      throw new Error(
        `Expected ${count} documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  docsAtLeast(count: number): this {
    if (this.#result.docs.length < count) {
      throw new Error(
        `Expected at least ${count} documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  docsAtMost(count: number): this {
    if (this.#result.docs.length > count) {
      throw new Error(
        `Expected at most ${count} documents, got ${this.#result.docs.length}`,
      );
    }
    return this;
  }

  docContains(subset: Partial<T>): this {
    const found = this.#result.docs.some((doc) => containsSubset(doc, subset));
    if (!found) {
      throw new Error(
        `Expected at least one document to contain ${JSON.stringify(subset)}`,
      );
    }
    return this;
  }

  docMatch(matcher: (docs: MongoDocs<T>) => void): this {
    matcher(this.#result.docs);
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoInsertResultExpectationImpl implements MongoInsertResultExpectation {
  readonly #result: MongoInsertOneResult | MongoInsertManyResult;

  constructor(result: MongoInsertOneResult | MongoInsertManyResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  insertedCount(count: number): this {
    const actualCount = "insertedCount" in this.#result
      ? this.#result.insertedCount
      : 1;
    if (actualCount !== count) {
      throw new Error(
        `Expected ${count} inserted documents, got ${actualCount}`,
      );
    }
    return this;
  }

  hasInsertedId(): this {
    if ("insertedId" in this.#result) {
      if (!this.#result.insertedId) {
        throw new Error("Expected insertedId, but it is empty");
      }
    } else {
      if (this.#result.insertedIds.length === 0) {
        throw new Error("Expected insertedIds, but array is empty");
      }
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoUpdateResultExpectationImpl implements MongoUpdateResultExpectation {
  readonly #result: MongoUpdateResult;

  constructor(result: MongoUpdateResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  matchedCount(count: number): this {
    if (this.#result.matchedCount !== count) {
      throw new Error(
        `Expected ${count} matched documents, got ${this.#result.matchedCount}`,
      );
    }
    return this;
  }

  modifiedCount(count: number): this {
    if (this.#result.modifiedCount !== count) {
      throw new Error(
        `Expected ${count} modified documents, got ${this.#result.modifiedCount}`,
      );
    }
    return this;
  }

  wasUpserted(): this {
    if (!this.#result.upsertedId) {
      throw new Error("Expected upsert, but no document was upserted");
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

class MongoDeleteResultExpectationImpl implements MongoDeleteResultExpectation {
  readonly #result: MongoDeleteResult;

  constructor(result: MongoDeleteResult) {
    this.#result = result;
  }

  ok(): this {
    if (!this.#result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.#result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  deletedCount(count: number): this {
    if (this.#result.deletedCount !== count) {
      throw new Error(
        `Expected ${count} deleted documents, got ${this.#result.deletedCount}`,
      );
    }
    return this;
  }

  deletedAtLeast(count: number): this {
    if (this.#result.deletedCount < count) {
      throw new Error(
        `Expected at least ${count} deleted documents, got ${this.#result.deletedCount}`,
      );
    }
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.#result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.#result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Create a fluent expectation chain for MongoDB find result validation.
 */
// deno-lint-ignore no-explicit-any
export function expectMongoFindResult<T = any>(
  result: MongoFindResult<T>,
): MongoFindResultExpectation<T> {
  return new MongoFindResultExpectationImpl(result);
}

/**
 * Create a fluent expectation chain for MongoDB insert result validation.
 */
export function expectMongoInsertResult(
  result: MongoInsertOneResult | MongoInsertManyResult,
): MongoInsertResultExpectation {
  return new MongoInsertResultExpectationImpl(result);
}

/**
 * Create a fluent expectation chain for MongoDB update result validation.
 */
export function expectMongoUpdateResult(
  result: MongoUpdateResult,
): MongoUpdateResultExpectation {
  return new MongoUpdateResultExpectationImpl(result);
}

/**
 * Create a fluent expectation chain for MongoDB delete result validation.
 */
export function expectMongoDeleteResult(
  result: MongoDeleteResult,
): MongoDeleteResultExpectation {
  return new MongoDeleteResultExpectationImpl(result);
}
