import type { MongoDocs } from "./types.ts";
import { MongoNotFoundError } from "./errors.ts";

/**
 * Create a MongoDocs array from a regular array.
 */
export function createMongoDocs<T>(items: T[]): MongoDocs<T> {
  const arr = [...items] as unknown as MongoDocs<T>;

  Object.defineProperty(arr, "first", {
    value: function (): T | undefined {
      return this[0];
    },
    enumerable: false,
  });

  Object.defineProperty(arr, "firstOrThrow", {
    value: function (): T {
      if (this.length === 0) {
        throw new MongoNotFoundError("No documents found (firstOrThrow)");
      }
      return this[0];
    },
    enumerable: false,
  });

  Object.defineProperty(arr, "last", {
    value: function (): T | undefined {
      return this.length > 0 ? this[this.length - 1] : undefined;
    },
    enumerable: false,
  });

  Object.defineProperty(arr, "lastOrThrow", {
    value: function (): T {
      if (this.length === 0) {
        throw new MongoNotFoundError("No documents found (lastOrThrow)");
      }
      return this[this.length - 1];
    },
    enumerable: false,
  });

  return arr;
}
