import type {
  RedisArrayResult,
  RedisCountResult,
  RedisResult,
} from "./types.ts";

/**
 * Base fluent API for Redis result validation.
 */
export interface RedisResultExpectation<T> {
  /** Assert that result ok is true */
  ok(): this;

  /** Assert that result ok is false */
  notOk(): this;

  /** Assert that value matches expected */
  value(expected: T): this;

  /** Assert value using custom matcher function */
  valueMatch(matcher: (value: T) => void): this;

  /** Assert that duration is less than threshold (ms) */
  durationLessThan(ms: number): this;
}

/**
 * Fluent API for Redis count result validation.
 */
export interface RedisCountResultExpectation
  extends RedisResultExpectation<number> {
  /** Assert that count equals expected */
  count(expected: number): this;

  /** Assert that count is at least min */
  countAtLeast(min: number): this;

  /** Assert that count is at most max */
  countAtMost(max: number): this;
}

/**
 * Fluent API for Redis array result validation.
 */
export interface RedisArrayResultExpectation<T>
  extends RedisResultExpectation<readonly T[]> {
  /** Assert that array is empty */
  noContent(): this;

  /** Assert that array is not empty */
  hasContent(): this;

  /** Assert that array length equals expected */
  length(count: number): this;

  /** Assert that array length is at least min */
  lengthAtLeast(min: number): this;

  /** Assert that array contains item */
  contains(item: T): this;
}

/**
 * Base implementation for Redis result expectations.
 */
class RedisResultExpectationImpl<T> implements RedisResultExpectation<T> {
  protected readonly result: RedisResult<T>;

  constructor(result: RedisResult<T>) {
    this.result = result;
  }

  ok(): this {
    if (!this.result.ok) {
      throw new Error("Expected ok result, but ok is false");
    }
    return this;
  }

  notOk(): this {
    if (this.result.ok) {
      throw new Error("Expected not ok result, but ok is true");
    }
    return this;
  }

  value(expected: T): this {
    if (this.result.value !== expected) {
      throw new Error(
        `Expected value ${JSON.stringify(expected)}, got ${
          JSON.stringify(this.result.value)
        }`,
      );
    }
    return this;
  }

  valueMatch(matcher: (value: T) => void): this {
    matcher(this.result.value);
    return this;
  }

  durationLessThan(ms: number): this {
    if (this.result.duration >= ms) {
      throw new Error(
        `Expected duration < ${ms}ms, got ${this.result.duration}ms`,
      );
    }
    return this;
  }
}

/**
 * Implementation for Redis count result expectations.
 */
class RedisCountResultExpectationImpl extends RedisResultExpectationImpl<number>
  implements RedisCountResultExpectation {
  constructor(result: RedisCountResult) {
    super(result);
  }

  count(expected: number): this {
    if (this.result.value !== expected) {
      throw new Error(
        `Expected count ${expected}, got ${this.result.value}`,
      );
    }
    return this;
  }

  countAtLeast(min: number): this {
    if (this.result.value < min) {
      throw new Error(
        `Expected count >= ${min}, got ${this.result.value}`,
      );
    }
    return this;
  }

  countAtMost(max: number): this {
    if (this.result.value > max) {
      throw new Error(
        `Expected count <= ${max}, got ${this.result.value}`,
      );
    }
    return this;
  }
}

/**
 * Implementation for Redis array result expectations.
 */
class RedisArrayResultExpectationImpl<T>
  extends RedisResultExpectationImpl<readonly T[]>
  implements RedisArrayResultExpectation<T> {
  constructor(result: RedisArrayResult<T>) {
    super(result);
  }

  noContent(): this {
    if (this.result.value.length !== 0) {
      throw new Error(
        `Expected empty array, got ${this.result.value.length} items`,
      );
    }
    return this;
  }

  hasContent(): this {
    if (this.result.value.length === 0) {
      throw new Error("Expected non-empty array, but array is empty");
    }
    return this;
  }

  length(count: number): this {
    if (this.result.value.length !== count) {
      throw new Error(
        `Expected array length ${count}, got ${this.result.value.length}`,
      );
    }
    return this;
  }

  lengthAtLeast(min: number): this {
    if (this.result.value.length < min) {
      throw new Error(
        `Expected array length >= ${min}, got ${this.result.value.length}`,
      );
    }
    return this;
  }

  contains(item: T): this {
    if (!this.result.value.includes(item)) {
      throw new Error(
        `Expected array to contain ${JSON.stringify(item)}`,
      );
    }
    return this;
  }
}

/**
 * Create a fluent expectation chain for Redis result validation.
 */
export function expectRedisResult<T>(
  result: RedisResult<T>,
): RedisResultExpectation<T> {
  return new RedisResultExpectationImpl(result);
}

/**
 * Create a fluent expectation chain for Redis count result validation.
 */
export function expectRedisCountResult(
  result: RedisCountResult,
): RedisCountResultExpectation {
  return new RedisCountResultExpectationImpl(result);
}

/**
 * Create a fluent expectation chain for Redis array result validation.
 */
export function expectRedisArrayResult<T = string>(
  result: RedisArrayResult<T>,
): RedisArrayResultExpectation<T> {
  return new RedisArrayResultExpectationImpl(result);
}
