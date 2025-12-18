import { assert, assertEquals, assertFalse } from "@std/assert";
import { DenoKvConnectionError, DenoKvError } from "./errors.ts";
import type { DenoKvEntry } from "./result.ts";
import {
  createDenoKvAtomicResultCheckFailed,
  createDenoKvAtomicResultCommitted,
  createDenoKvAtomicResultError,
  createDenoKvAtomicResultFailure,
  createDenoKvDeleteResultError,
  createDenoKvDeleteResultFailure,
  createDenoKvDeleteResultSuccess,
  createDenoKvGetResultError,
  createDenoKvGetResultFailure,
  createDenoKvGetResultSuccess,
  createDenoKvListResultError,
  createDenoKvListResultFailure,
  createDenoKvListResultSuccess,
  createDenoKvSetResultError,
  createDenoKvSetResultFailure,
  createDenoKvSetResultSuccess,
} from "./result.ts";

function createEntry<T>(
  key: Deno.KvKey,
  value: T,
  versionstamp: string,
): DenoKvEntry<T> {
  return { key, value, versionstamp };
}

// ============================================================================
// DenoKvGetResult
// ============================================================================

Deno.test("DenoKvGetResultSuccess", async (t) => {
  await t.step("has correct structure", () => {
    const result = createDenoKvGetResultSuccess<number>({
      key: ["test"],
      value: 42,
      versionstamp: "v1",
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:get");
    assertEquals(result.processed, true);
    assert(result.ok);
    assertEquals(result.error, null);
    assertEquals(result.key, ["test"]);
    assertEquals(result.value, 42);
    assertEquals(result.versionstamp, "v1");
    assertEquals(result.duration, 10);
  });

  await t.step("handles null value (key not found)", () => {
    const result = createDenoKvGetResultSuccess<number>({
      key: ["test"],
      value: null,
      versionstamp: null,
      duration: 10,
    });
    assert(result.ok);
    assertEquals(result.value, null);
    assertEquals(result.versionstamp, null);
  });
});

Deno.test("DenoKvGetResultError", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvError("quota exceeded", "quota");
    const result = createDenoKvGetResultError<number>({
      key: ["test"],
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:get");
    assertEquals(result.processed, true);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.key, ["test"]);
    assertEquals(result.value, null);
    assertEquals(result.versionstamp, null);
  });
});

Deno.test("DenoKvGetResultFailure", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvConnectionError("network timeout");
    const result = createDenoKvGetResultFailure<number>({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:get");
    assertEquals(result.processed, false);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.key, null);
    assertEquals(result.value, null);
    assertEquals(result.versionstamp, null);
  });
});

// ============================================================================
// DenoKvSetResult
// ============================================================================

Deno.test("DenoKvSetResultSuccess", async (t) => {
  await t.step("has correct structure", () => {
    const result = createDenoKvSetResultSuccess({
      versionstamp: "v1",
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:set");
    assertEquals(result.processed, true);
    assert(result.ok);
    assertEquals(result.error, null);
    assertEquals(result.versionstamp, "v1");
  });
});

Deno.test("DenoKvSetResultError", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvError("quota exceeded", "quota");
    const result = createDenoKvSetResultError({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:set");
    assertEquals(result.processed, true);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.versionstamp, null);
  });
});

Deno.test("DenoKvSetResultFailure", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvConnectionError("network timeout");
    const result = createDenoKvSetResultFailure({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:set");
    assertEquals(result.processed, false);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.versionstamp, null);
  });
});

// ============================================================================
// DenoKvDeleteResult
// ============================================================================

Deno.test("DenoKvDeleteResultSuccess", async (t) => {
  await t.step("has correct structure", () => {
    const result = createDenoKvDeleteResultSuccess({
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:delete");
    assertEquals(result.processed, true);
    assert(result.ok);
    assertEquals(result.error, null);
  });
});

Deno.test("DenoKvDeleteResultError", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvError("quota exceeded", "quota");
    const result = createDenoKvDeleteResultError({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:delete");
    assertEquals(result.processed, true);
    assertFalse(result.ok);
    assertEquals(result.error, error);
  });
});

Deno.test("DenoKvDeleteResultFailure", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvConnectionError("network timeout");
    const result = createDenoKvDeleteResultFailure({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:delete");
    assertEquals(result.processed, false);
    assertFalse(result.ok);
    assertEquals(result.error, error);
  });
});

// ============================================================================
// DenoKvListResult
// ============================================================================

Deno.test("DenoKvListResultSuccess", async (t) => {
  await t.step("has correct structure", () => {
    const entries = [
      createEntry(["a"], 1, "v1"),
      createEntry(["b"], 2, "v2"),
    ];
    const result = createDenoKvListResultSuccess<number>({
      entries,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:list");
    assertEquals(result.processed, true);
    assert(result.ok);
    assertEquals(result.error, null);
    assertEquals(result.entries.length, 2);
    assertEquals(result.entries[0], {
      key: ["a"],
      value: 1,
      versionstamp: "v1",
    });
  });

  await t.step("handles empty entries", () => {
    const result = createDenoKvListResultSuccess<number>({
      entries: [],
      duration: 10,
    });
    assertEquals(result.entries.length, 0);
  });
});

Deno.test("DenoKvListResultError", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvError("quota exceeded", "quota");
    const result = createDenoKvListResultError<number>({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:list");
    assertEquals(result.processed, true);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.entries.length, 0);
  });
});

Deno.test("DenoKvListResultFailure", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvConnectionError("network timeout");
    const result = createDenoKvListResultFailure<number>({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:list");
    assertEquals(result.processed, false);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.entries.length, 0);
  });
});

// ============================================================================
// DenoKvAtomicResult
// ============================================================================

Deno.test("DenoKvAtomicResultCommitted", async (t) => {
  await t.step("has correct structure", () => {
    const result = createDenoKvAtomicResultCommitted({
      versionstamp: "v1",
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:atomic");
    assertEquals(result.processed, true);
    assert(result.ok);
    assertEquals(result.error, null);
    assertEquals(result.versionstamp, "v1");
  });
});

Deno.test("DenoKvAtomicResultCheckFailed", async (t) => {
  await t.step("has correct structure", () => {
    const result = createDenoKvAtomicResultCheckFailed({
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:atomic");
    assertEquals(result.processed, true);
    assertFalse(result.ok);
    assertEquals(result.error, null); // Check failure is NOT an error
    assertEquals(result.versionstamp, null);
  });
});

Deno.test("DenoKvAtomicResultError", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvError("quota exceeded", "quota");
    const result = createDenoKvAtomicResultError({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:atomic");
    assertEquals(result.processed, true);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.versionstamp, null);
  });
});

Deno.test("DenoKvAtomicResultFailure", async (t) => {
  await t.step("has correct structure", () => {
    const error = new DenoKvConnectionError("network timeout");
    const result = createDenoKvAtomicResultFailure({
      error,
      duration: 10,
    });
    assertEquals(result.kind, "deno-kv:atomic");
    assertEquals(result.processed, false);
    assertFalse(result.ok);
    assertEquals(result.error, error);
    assertEquals(result.versionstamp, null);
  });
});
