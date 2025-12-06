import { assertEquals } from "@std/assert";
import { containsSubarray, containsSubset } from "./utils.ts";

Deno.test("containsSubset", async (t) => {
  await t.step("returns true for identical primitives", () => {
    assertEquals(containsSubset(1, 1), true);
    assertEquals(containsSubset("hello", "hello"), true);
    assertEquals(containsSubset(true, true), true);
    assertEquals(containsSubset(null, null), true);
  });

  await t.step("returns false for different primitives", () => {
    assertEquals(containsSubset(1, 2), false);
    assertEquals(containsSubset("hello", "world"), false);
    assertEquals(containsSubset(true, false), false);
    assertEquals(containsSubset(null, "value"), false);
    assertEquals(containsSubset("value", null), false);
  });

  await t.step("returns true for top-level partial match", () => {
    assertEquals(containsSubset({ a: 1, b: 2, c: 3 }, { a: 1 }), true);
    assertEquals(containsSubset({ a: 1, b: 2, c: 3 }, { a: 1, b: 2 }), true);
    assertEquals(
      containsSubset({ a: 1, b: 2, c: 3 }, { a: 1, b: 2, c: 3 }),
      true,
    );
  });

  await t.step("returns false for top-level mismatch", () => {
    assertEquals(containsSubset({ a: 1, b: 2 }, { a: 2 }), false);
    assertEquals(containsSubset({ a: 1 }, { b: 1 }), false);
    assertEquals(containsSubset({ a: 1 }, { a: 1, b: 2 }), false);
  });

  await t.step("returns true for nested object partial match", () => {
    assertEquals(
      containsSubset(
        { args: { name: "probitas", version: "1.0" } },
        { args: { name: "probitas" } },
      ),
      true,
    );
    assertEquals(
      containsSubset(
        { data: { user: { profile: { name: "John", age: 30 } } } },
        { data: { user: { profile: { name: "John" } } } },
      ),
      true,
    );
  });

  await t.step("returns false for nested object mismatch", () => {
    assertEquals(
      containsSubset(
        { args: { name: "probitas" } },
        { args: { name: "different" } },
      ),
      false,
    );
    assertEquals(
      containsSubset(
        { args: { version: "1.0" } },
        { args: { name: "test" } },
      ),
      false,
    );
  });

  await t.step("returns true for exact array match", () => {
    assertEquals(containsSubset([1, 2, 3], [1, 2, 3]), true);
    assertEquals(
      containsSubset({ items: [1, 2, 3] }, { items: [1, 2, 3] }),
      true,
    );
  });

  await t.step("returns false for array length mismatch", () => {
    assertEquals(containsSubset([1, 2, 3], [1, 2]), false);
    assertEquals(containsSubset([1, 2], [1, 2, 3]), false);
    assertEquals(
      containsSubset({ items: [1, 2, 3] }, { items: [1, 2] }),
      false,
    );
  });

  await t.step("returns false for array element mismatch", () => {
    assertEquals(containsSubset([1, 2, 3], [1, 2, 4]), false);
    assertEquals(containsSubset([1, 2, 3], [3, 2, 1]), false);
  });

  await t.step("handles arrays with nested objects", () => {
    assertEquals(
      containsSubset(
        { users: [{ name: "John" }, { name: "Jane" }] },
        { users: [{ name: "John" }, { name: "Jane" }] },
      ),
      true,
    );
    assertEquals(
      containsSubset(
        { users: [{ name: "John", age: 30 }, { name: "Jane", age: 25 }] },
        { users: [{ name: "John" }, { name: "Jane" }] },
      ),
      true,
    );
  });

  await t.step("handles mixed nested and top-level properties", () => {
    assertEquals(
      containsSubset(
        { status: "ok", data: { message: "Hello", count: 42 } },
        { status: "ok", data: { message: "Hello" } },
      ),
      true,
    );
  });

  await t.step("returns false when comparing object to primitive", () => {
    assertEquals(containsSubset({ a: 1 }, 1), false);
    assertEquals(containsSubset(1, { a: 1 }), false);
    assertEquals(containsSubset({ a: 1 }, "string"), false);
  });

  await t.step("returns false when comparing array to object", () => {
    assertEquals(containsSubset({ a: 1 }, [1]), false);
    assertEquals(containsSubset([1], { a: 1 }), false);
  });

  await t.step("handles undefined values correctly", () => {
    assertEquals(containsSubset({ a: undefined }, { a: undefined }), true);
    assertEquals(containsSubset({ a: 1 }, { a: undefined }), false);
  });
});

Deno.test("containsSubarray", async (t) => {
  await t.step("returns true for empty subarray", () => {
    assertEquals(
      containsSubarray(new Uint8Array([1, 2, 3]), new Uint8Array([])),
      true,
    );
    assertEquals(
      containsSubarray(new Uint8Array([]), new Uint8Array([])),
      true,
    );
  });

  await t.step("returns true when subarray is found at start", () => {
    assertEquals(
      containsSubarray(new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array([1, 2])),
      true,
    );
  });

  await t.step("returns true when subarray is found in middle", () => {
    assertEquals(
      containsSubarray(
        new Uint8Array([1, 2, 3, 4, 5]),
        new Uint8Array([2, 3, 4]),
      ),
      true,
    );
  });

  await t.step("returns true when subarray is found at end", () => {
    assertEquals(
      containsSubarray(new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array([4, 5])),
      true,
    );
  });

  await t.step("returns true when arrays are identical", () => {
    assertEquals(
      containsSubarray(
        new Uint8Array([1, 2, 3]),
        new Uint8Array([1, 2, 3]),
      ),
      true,
    );
  });

  await t.step("returns false when subarray is not found", () => {
    assertEquals(
      containsSubarray(
        new Uint8Array([1, 2, 3, 4, 5]),
        new Uint8Array([6, 7, 8]),
      ),
      false,
    );
  });

  await t.step("returns false for non-contiguous match", () => {
    assertEquals(
      containsSubarray(new Uint8Array([1, 2, 3, 4, 5]), new Uint8Array([1, 3])),
      false,
    );
  });

  await t.step("returns false when subarray is longer than array", () => {
    assertEquals(
      containsSubarray(
        new Uint8Array([1, 2]),
        new Uint8Array([1, 2, 3, 4, 5]),
      ),
      false,
    );
  });

  await t.step("returns false for empty array with non-empty subarray", () => {
    assertEquals(
      containsSubarray(new Uint8Array([]), new Uint8Array([1])),
      false,
    );
  });
});
