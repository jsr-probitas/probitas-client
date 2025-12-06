import { assertEquals, assertMatch, assertThrows } from "@std/assert";
import { expectDenoKvResult } from "./expect.ts";
import { createDenoKvEntries } from "./results.ts";
import type {
  DenoKvAtomicResult,
  DenoKvDeleteResult,
  DenoKvGetResult,
  DenoKvListResult,
  DenoKvSetResult,
} from "./results.ts";

function createGetResult<T>(
  overrides: Partial<DenoKvGetResult<T>> = {},
): DenoKvGetResult<T> {
  return {
    type: "deno-kv:get",
    ok: overrides.ok ?? true,
    key: overrides.key ?? ["test"],
    value: ("value" in overrides ? overrides.value : { name: "test" }) as
      | T
      | null,
    versionstamp: "versionstamp" in overrides
      ? overrides.versionstamp!
      : "00000001",
    duration: overrides.duration ?? 10,
  };
}

function createListResult<T>(
  overrides: Partial<DenoKvListResult<T>> = {},
): DenoKvListResult<T> {
  return {
    type: "deno-kv:list",
    ok: overrides.ok ?? true,
    entries: overrides.entries ?? createDenoKvEntries([]),
    duration: overrides.duration ?? 10,
  };
}

function createSetResult(
  overrides: Partial<DenoKvSetResult> = {},
): DenoKvSetResult {
  return {
    type: "deno-kv:set",
    ok: overrides.ok ?? true,
    versionstamp: overrides.versionstamp ?? "00000001",
    duration: overrides.duration ?? 10,
  };
}

function createDeleteResult(
  overrides: Partial<DenoKvDeleteResult> = {},
): DenoKvDeleteResult {
  return {
    type: "deno-kv:delete",
    ok: overrides.ok ?? true,
    duration: overrides.duration ?? 10,
  };
}

function createAtomicResult(
  overrides: Partial<DenoKvAtomicResult> = {},
): DenoKvAtomicResult {
  return {
    type: "deno-kv:atomic",
    ok: overrides.ok ?? true,
    versionstamp: overrides.versionstamp ?? "00000001",
    duration: overrides.duration ?? 10,
  };
}

Deno.test("expectDenoKvResult with GetResult", async (t) => {
  await t.step("ok() passes for ok result", () => {
    const result = createGetResult({ ok: true });
    expectDenoKvResult(result).ok();
  });

  await t.step("ok() throws for not ok result", () => {
    const result = createGetResult({ ok: false });
    assertThrows(
      () => expectDenoKvResult(result).ok(),
      Error,
      "Expected ok result",
    );
  });

  await t.step("notOk() passes for not ok result", () => {
    const result = createGetResult({ ok: false });
    expectDenoKvResult(result).notOk();
  });

  await t.step("notOk() throws for ok result", () => {
    const result = createGetResult({ ok: true });
    assertThrows(
      () => expectDenoKvResult(result).notOk(),
      Error,
      "Expected not ok result",
    );
  });

  await t.step("noContent() passes when value is null", () => {
    const result = createGetResult({ value: null });
    expectDenoKvResult(result).noContent();
  });

  await t.step("noContent() throws when value exists", () => {
    const result = createGetResult({ value: { name: "test" } });
    assertThrows(
      () => expectDenoKvResult(result).noContent(),
      Error,
      "Expected no content",
    );
  });

  await t.step("hasContent() passes when value exists", () => {
    const result = createGetResult({ value: { name: "test" } });
    expectDenoKvResult(result).hasContent();
  });

  await t.step("hasContent() throws when value is null", () => {
    const result = createGetResult({ value: null });
    assertThrows(
      () => expectDenoKvResult(result).hasContent(),
      Error,
      "Expected content",
    );
  });

  await t.step("value() passes when value matches", () => {
    const result = createGetResult({ value: { name: "Alice", age: 30 } });
    expectDenoKvResult(result).value({ name: "Alice", age: 30 });
  });

  await t.step("value() throws when value does not match", () => {
    const result = createGetResult({ value: { name: "Alice" } });
    assertThrows(
      () => expectDenoKvResult(result).value({ name: "Bob" }),
      Error,
      "Expected value",
    );
  });

  await t.step("value() throws when value is null", () => {
    const result = createGetResult<{ name: string }>({ value: null });
    assertThrows(
      () => expectDenoKvResult(result).value({ name: "Alice" }),
      Error,
      "Expected value, but value is null",
    );
  });

  await t.step("valueContains() passes when value contains subset", () => {
    const result = createGetResult({ value: { name: "Alice", age: 30 } });
    expectDenoKvResult(result).valueContains({ name: "Alice" });
  });

  await t.step("valueContains() passes with nested object subset", () => {
    // deno-lint-ignore no-explicit-any
    const result = createGetResult<any>({
      value: { user: { name: "Alice", profile: { city: "NYC" } } },
    });
    expectDenoKvResult(result).valueContains({ user: { name: "Alice" } });
  });

  await t.step("valueContains() passes with deeply nested subset", () => {
    // deno-lint-ignore no-explicit-any
    const result = createGetResult<any>({
      value: {
        data: {
          user: {
            profile: { name: "John", age: 30 },
            settings: { theme: "dark" },
          },
        },
      },
    });
    expectDenoKvResult(result).valueContains({
      data: { user: { profile: { name: "John" } } },
    });
  });

  await t.step("valueContains() passes with nested array elements", () => {
    // deno-lint-ignore no-explicit-any
    const result = createGetResult<any>({
      value: { items: [1, 2, 3], nested: { values: [10, 20, 30] } },
    });
    expectDenoKvResult(result).valueContains({ items: [1, 2, 3] });
  });

  await t.step(
    "valueContains() throws when nested object does not match",
    () => {
      // deno-lint-ignore no-explicit-any
      const result = createGetResult<any>({
        value: { args: { name: "probitas", version: "1.0" } },
      });
      assertThrows(
        () =>
          expectDenoKvResult(result).valueContains({
            args: { name: "different" },
          }),
        Error,
        "Value does not contain expected properties",
      );
    },
  );

  await t.step("valueContains() throws when nested property is missing", () => {
    // deno-lint-ignore no-explicit-any
    const result = createGetResult<any>({
      value: { args: { version: "1.0" } },
    });
    assertThrows(
      () =>
        expectDenoKvResult(result).valueContains({ args: { name: "test" } }),
      Error,
      "Value does not contain expected properties",
    );
  });

  await t.step(
    "valueContains() passes with mixed nested and top-level properties",
    () => {
      // deno-lint-ignore no-explicit-any
      const result = createGetResult<any>({
        value: { status: "ok", data: { message: "Hello", count: 42 } },
      });
      expectDenoKvResult(result).valueContains({
        status: "ok",
        data: { message: "Hello" },
      });
    },
  );

  await t.step(
    "valueContains() throws when value does not contain subset",
    () => {
      const result = createGetResult({ value: { name: "Alice" } });
      assertThrows(
        () => expectDenoKvResult(result).valueContains({ name: "Bob" }),
        Error,
        "Value does not contain expected properties",
      );
    },
  );

  await t.step("valueMatch() calls matcher with value", () => {
    const result = createGetResult({ value: { name: "Alice" } });
    let captured = null;
    expectDenoKvResult(result).valueMatch((v) => {
      captured = v;
    });
    assertEquals(captured, { name: "Alice" });
  });

  await t.step("valueMatch() throws if matcher throws", () => {
    const result = createGetResult({ value: { name: "Alice" } });
    assertThrows(
      () =>
        expectDenoKvResult(result).valueMatch(() => {
          throw new Error("custom error");
        }),
      Error,
      "custom error",
    );
  });

  await t.step("hasVersionstamp() passes when versionstamp exists", () => {
    const result = createGetResult({ versionstamp: "00000001" });
    expectDenoKvResult(result).hasVersionstamp();
  });

  await t.step("hasVersionstamp() throws when versionstamp is null", () => {
    const result = createGetResult({ versionstamp: null });
    assertThrows(
      () => expectDenoKvResult(result).hasVersionstamp(),
      Error,
      "Expected versionstamp",
    );
  });

  await t.step(
    "durationLessThan() passes when duration is less than threshold",
    () => {
      const result = createGetResult({ duration: 50 });
      expectDenoKvResult(result).durationLessThan(100);
    },
  );

  await t.step(
    "durationLessThan() throws when duration exceeds threshold",
    () => {
      const result = createGetResult({ duration: 150 });
      assertThrows(
        () => expectDenoKvResult(result).durationLessThan(100),
        Error,
        "Expected duration < 100ms, got 150ms",
      );
    },
  );

  await t.step("allows chaining multiple assertions", () => {
    const result = createGetResult({
      ok: true,
      value: { name: "Alice", age: 30 },
      versionstamp: "00000001",
      duration: 50,
    });

    expectDenoKvResult(result)
      .ok()
      .hasContent()
      .valueContains({ name: "Alice" })
      .hasVersionstamp()
      .durationLessThan(100);
  });
});

Deno.test("expectDenoKvResult with ListResult", async (t) => {
  await t.step("ok() passes for ok result", () => {
    const result = createListResult({ ok: true });
    expectDenoKvResult(result).ok();
  });

  await t.step("ok() throws for not ok result", () => {
    const result = createListResult({ ok: false });
    assertThrows(
      () => expectDenoKvResult(result).ok(),
      Error,
      "Expected ok result",
    );
  });

  await t.step("notOk() passes for not ok result", () => {
    const result = createListResult({ ok: false });
    expectDenoKvResult(result).notOk();
  });

  await t.step("notOk() throws for ok result", () => {
    const result = createListResult({ ok: true });
    assertThrows(
      () => expectDenoKvResult(result).notOk(),
      Error,
      "Expected not ok result",
    );
  });

  await t.step("noContent() passes when entries is empty", () => {
    const result = createListResult({ entries: createDenoKvEntries([]) });
    expectDenoKvResult(result).noContent();
  });

  await t.step("noContent() throws when entries exist", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
      ]),
    });
    assertThrows(
      () => expectDenoKvResult(result).noContent(),
      Error,
      "Expected no entries",
    );
  });

  await t.step("hasContent() passes when entries exist", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
      ]),
    });
    expectDenoKvResult(result).hasContent();
  });

  await t.step("hasContent() throws when entries is empty", () => {
    const result = createListResult({ entries: createDenoKvEntries([]) });
    assertThrows(
      () => expectDenoKvResult(result).hasContent(),
      Error,
      "Expected entries",
    );
  });

  await t.step("count() passes when count matches", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
        { key: ["b"], value: 2, versionstamp: "v2" },
      ]),
    });
    expectDenoKvResult(result).count(2);
  });

  await t.step("count() throws when count does not match", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
      ]),
    });
    assertThrows(
      () => expectDenoKvResult(result).count(2),
      Error,
      "Expected 2 entries, got 1",
    );
  });

  await t.step("countAtLeast() passes when count is at least min", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
        { key: ["b"], value: 2, versionstamp: "v2" },
      ]),
    });
    expectDenoKvResult(result).countAtLeast(2);
  });

  await t.step("countAtLeast() throws when count is less than min", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
      ]),
    });
    assertThrows(
      () => expectDenoKvResult(result).countAtLeast(2),
      Error,
      "Expected at least 2 entries, got 1",
    );
  });

  await t.step("countAtMost() passes when count is at most max", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
      ]),
    });
    expectDenoKvResult(result).countAtMost(2);
  });

  await t.step("countAtMost() throws when count exceeds max", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
        { key: ["b"], value: 2, versionstamp: "v2" },
        { key: ["c"], value: 3, versionstamp: "v3" },
      ]),
    });
    assertThrows(
      () => expectDenoKvResult(result).countAtMost(2),
      Error,
      "Expected at most 2 entries, got 3",
    );
  });

  await t.step("entryContains() passes when entry matches key", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["users", "1"], value: { name: "Alice" }, versionstamp: "v1" },
      ]),
    });
    expectDenoKvResult(result).entryContains({ key: ["users", "1"] });
  });

  await t.step("entryContains() passes when entry matches value", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["users", "1"], value: { name: "Alice" }, versionstamp: "v1" },
      ]),
    });
    expectDenoKvResult(result).entryContains({ value: { name: "Alice" } });
  });

  await t.step(
    "entryContains() passes when entry matches both key and value",
    () => {
      const result = createListResult({
        entries: createDenoKvEntries([
          { key: ["users", "1"], value: { name: "Alice" }, versionstamp: "v1" },
        ]),
      });
      expectDenoKvResult(result).entryContains({
        key: ["users", "1"],
        value: { name: "Alice" },
      });
    },
  );

  await t.step("entryContains() throws when no entry matches", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["users", "1"], value: { name: "Alice" }, versionstamp: "v1" },
      ]),
    });
    assertThrows(
      () => expectDenoKvResult(result).entryContains({ key: ["users", "2"] }),
      Error,
      "No entry matches the expected criteria",
    );
  });

  await t.step("entriesMatch() calls matcher with entries", () => {
    const entries = createDenoKvEntries([
      { key: ["a"], value: 1, versionstamp: "v1" },
    ]);
    const result = createListResult({ entries });
    let captured = null;
    expectDenoKvResult(result).entriesMatch((e) => {
      captured = e;
    });
    assertEquals(captured, entries);
  });

  await t.step(
    "durationLessThan() passes when duration is less than threshold",
    () => {
      const result = createListResult({ duration: 50 });
      expectDenoKvResult(result).durationLessThan(100);
    },
  );

  await t.step(
    "durationLessThan() throws when duration exceeds threshold",
    () => {
      const result = createListResult({ duration: 150 });
      assertThrows(
        () => expectDenoKvResult(result).durationLessThan(100),
        Error,
        "Expected duration < 100ms, got 150ms",
      );
    },
  );
});

Deno.test("expectDenoKvResult with SetResult", async (t) => {
  await t.step("ok() passes for ok result", () => {
    const result = createSetResult({ ok: true });
    expectDenoKvResult(result).ok();
  });

  await t.step("ok() throws for not ok result", () => {
    const result = createSetResult({ ok: false });
    assertThrows(
      () => expectDenoKvResult(result).ok(),
      Error,
      "Expected ok result",
    );
  });

  await t.step("notOk() passes for not ok result", () => {
    const result = createSetResult({ ok: false });
    expectDenoKvResult(result).notOk();
  });

  await t.step("notOk() throws for ok result", () => {
    const result = createSetResult({ ok: true });
    assertThrows(
      () => expectDenoKvResult(result).notOk(),
      Error,
      "Expected not ok result",
    );
  });

  await t.step("hasVersionstamp() passes when versionstamp exists", () => {
    const result = createSetResult({ versionstamp: "00000001" });
    expectDenoKvResult(result).hasVersionstamp();
  });

  await t.step("hasVersionstamp() throws when versionstamp is empty", () => {
    const result = createSetResult({ versionstamp: "" });
    assertThrows(
      () => expectDenoKvResult(result).hasVersionstamp(),
      Error,
      "Expected versionstamp",
    );
  });

  await t.step(
    "durationLessThan() passes when duration is less than threshold",
    () => {
      const result = createSetResult({ duration: 50 });
      expectDenoKvResult(result).durationLessThan(100);
    },
  );

  await t.step(
    "durationLessThan() throws when duration exceeds threshold",
    () => {
      const result = createSetResult({ duration: 150 });
      assertThrows(
        () => expectDenoKvResult(result).durationLessThan(100),
        Error,
        "Expected duration < 100ms, got 150ms",
      );
    },
  );
});

Deno.test("expectDenoKvResult with DeleteResult", async (t) => {
  await t.step("ok() passes for ok result", () => {
    const result = createDeleteResult({ ok: true });
    expectDenoKvResult(result).ok();
  });

  await t.step("ok() throws for not ok result", () => {
    const result = createDeleteResult({ ok: false });
    assertThrows(
      () => expectDenoKvResult(result).ok(),
      Error,
      "Expected ok result",
    );
  });

  await t.step("notOk() passes for not ok result", () => {
    const result = createDeleteResult({ ok: false });
    expectDenoKvResult(result).notOk();
  });

  await t.step("notOk() throws for ok result", () => {
    const result = createDeleteResult({ ok: true });
    assertThrows(
      () => expectDenoKvResult(result).notOk(),
      Error,
      "Expected not ok result",
    );
  });

  await t.step(
    "durationLessThan() passes when duration is less than threshold",
    () => {
      const result = createDeleteResult({ duration: 50 });
      expectDenoKvResult(result).durationLessThan(100);
    },
  );

  await t.step(
    "durationLessThan() throws when duration exceeds threshold",
    () => {
      const result = createDeleteResult({ duration: 150 });
      assertThrows(
        () => expectDenoKvResult(result).durationLessThan(100),
        Error,
        "Expected duration < 100ms, got 150ms",
      );
    },
  );
});

Deno.test("expectDenoKvResult with AtomicResult", async (t) => {
  await t.step("ok() passes for ok result", () => {
    const result = createAtomicResult({ ok: true });
    expectDenoKvResult(result).ok();
  });

  await t.step("ok() throws for not ok result", () => {
    const result = createAtomicResult({ ok: false });
    assertThrows(
      () => expectDenoKvResult(result).ok(),
      Error,
      "Expected ok result",
    );
  });

  await t.step("notOk() passes for not ok result", () => {
    const result = createAtomicResult({ ok: false });
    expectDenoKvResult(result).notOk();
  });

  await t.step("notOk() throws for ok result", () => {
    const result = createAtomicResult({ ok: true });
    assertThrows(
      () => expectDenoKvResult(result).notOk(),
      Error,
      "Expected not ok result",
    );
  });

  await t.step("hasVersionstamp() passes when versionstamp exists", () => {
    const result = createAtomicResult({ versionstamp: "00000001" });
    expectDenoKvResult(result).hasVersionstamp();
  });

  await t.step("hasVersionstamp() throws when versionstamp is missing", () => {
    const result: DenoKvAtomicResult = {
      type: "deno-kv:atomic",
      ok: false,
      duration: 10,
    };
    assertThrows(
      () => expectDenoKvResult(result).hasVersionstamp(),
      Error,
      "Expected versionstamp",
    );
  });

  await t.step(
    "durationLessThan() passes when duration is less than threshold",
    () => {
      const result = createAtomicResult({ duration: 50 });
      expectDenoKvResult(result).durationLessThan(100);
    },
  );

  await t.step(
    "durationLessThan() throws when duration exceeds threshold",
    () => {
      const result = createAtomicResult({ duration: 150 });
      assertThrows(
        () => expectDenoKvResult(result).durationLessThan(100),
        Error,
        "Expected duration < 100ms, got 150ms",
      );
    },
  );
});

Deno.test("expectDenoKvResult type inference", async (t) => {
  await t.step("infers GetResultExpectation for get result", () => {
    const result = createGetResult({ value: { name: "Alice" } });
    // TypeScript should infer DenoKvGetResultExpectation
    // which has noContent(), hasContent(), value(), etc.
    const expectation = expectDenoKvResult(result);
    expectation.ok().hasContent().valueContains({ name: "Alice" });
  });

  await t.step("infers ListResultExpectation for list result", () => {
    const result = createListResult({
      entries: createDenoKvEntries([
        { key: ["a"], value: 1, versionstamp: "v1" },
        { key: ["b"], value: 2, versionstamp: "v2" },
      ]),
    });
    // TypeScript should infer DenoKvListResultExpectation
    // which has count(), countAtLeast(), countAtMost(), etc.
    const expectation = expectDenoKvResult(result);
    expectation.ok().hasContent().count(2).countAtLeast(1).countAtMost(10);
  });

  await t.step("infers SetResultExpectation for set result", () => {
    const result = createSetResult();
    // TypeScript should infer DenoKvSetResultExpectation
    // which has hasVersionstamp()
    const expectation = expectDenoKvResult(result);
    expectation.ok().hasVersionstamp();
  });

  await t.step("infers DeleteResultExpectation for delete result", () => {
    const result = createDeleteResult();
    // TypeScript should infer DenoKvDeleteResultExpectation
    const expectation = expectDenoKvResult(result);
    expectation.ok().durationLessThan(100);
  });

  await t.step("infers AtomicResultExpectation for atomic result", () => {
    const result = createAtomicResult();
    // TypeScript should infer DenoKvAtomicResultExpectation
    // which has hasVersionstamp()
    const expectation = expectDenoKvResult(result);
    expectation.ok().hasVersionstamp();
  });
});

Deno.test("expectDenoKvResult error handling", async (t) => {
  await t.step("throws error for unknown result type", () => {
    const unknownResult = {
      type: "deno-kv:unknown",
      ok: true,
      duration: 10,
    };

    const error = assertThrows(
      // deno-lint-ignore no-explicit-any
      () => expectDenoKvResult(unknownResult as any),
      Error,
    );
    assertMatch(error.message, /Unknown Deno KV result type: deno-kv:unknown/);
  });
});
