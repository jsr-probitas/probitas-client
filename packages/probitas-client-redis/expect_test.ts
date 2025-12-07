import { assertEquals, assertMatch, assertThrows } from "@std/assert";
import type {
  RedisArrayResult,
  RedisCommonResult,
  RedisCountResult,
  RedisGetResult,
  RedisHashResult,
  RedisSetResult,
} from "./types.ts";
import { expectRedisResult } from "./expect.ts";

function createCommonResult<T>(
  value: T,
  ok = true,
  duration = 10,
): RedisCommonResult<T> {
  return { type: "redis:common", ok, value, duration };
}

function createGetResult(
  value: string | null,
  ok = true,
  duration = 10,
): RedisGetResult {
  return { type: "redis:get", ok, value, duration };
}

function createSetResult(
  ok = true,
  duration = 10,
): RedisSetResult {
  return { type: "redis:set", ok, value: "OK", duration };
}

function createHashResult(
  value: Record<string, string>,
  ok = true,
  duration = 10,
): RedisHashResult {
  return { type: "redis:hash", ok, value, duration };
}

function createCountResult(
  value: number,
  ok = true,
  duration = 10,
): RedisCountResult {
  return { type: "redis:count", ok, value, duration };
}

function createArrayResult<T>(
  value: readonly T[],
  ok = true,
  duration = 10,
): RedisArrayResult<T> {
  return { type: "redis:array", ok, value, duration };
}

Deno.test("expectRedisResult with CommonResult", async (t) => {
  await t.step("ok() passes when ok is true", () => {
    const result = createCommonResult("value");
    expectRedisResult(result).ok();
  });

  await t.step("ok() throws when ok is false", () => {
    const result = createCommonResult("value", false);
    assertThrows(
      () => expectRedisResult(result).ok(),
      Error,
      "Expected ok result",
    );
  });

  await t.step("notOk() passes when ok is false", () => {
    const result = createCommonResult("value", false);
    expectRedisResult(result).notOk();
  });

  await t.step("notOk() throws when ok is true", () => {
    const result = createCommonResult("value");
    assertThrows(
      () => expectRedisResult(result).notOk(),
      Error,
      "Expected not ok result",
    );
  });

  await t.step("data() passes when values match", () => {
    const result = createCommonResult("expected");
    expectRedisResult(result).data("expected");
  });

  await t.step("data() throws when values don't match", () => {
    const result = createCommonResult("actual");
    assertThrows(
      () => expectRedisResult(result).data("expected"),
      Error,
      "Expected data",
    );
  });

  await t.step("dataMatch() calls matcher with value", () => {
    const result = createCommonResult("test");
    let called = false;
    expectRedisResult(result).dataMatch((v) => {
      assertEquals(v, "test");
      called = true;
    });
    assertEquals(called, true);
  });

  await t.step("durationLessThan() passes when duration is less", () => {
    const result = createCommonResult("value", true, 50);
    expectRedisResult(result).durationLessThan(100);
  });

  await t.step("durationLessThan() throws when duration is greater", () => {
    const result = createCommonResult("value", true, 150);
    assertThrows(
      () => expectRedisResult(result).durationLessThan(100),
      Error,
      "Expected duration",
    );
  });

  await t.step("methods can be chained", () => {
    const result = createCommonResult("test", true, 50);
    expectRedisResult(result)
      .ok()
      .data("test")
      .durationLessThan(100);
  });
});

Deno.test("expectRedisResult with GetResult", async (t) => {
  await t.step("returns correct expectation for get result", () => {
    const result = createGetResult("value");
    expectRedisResult(result).ok().data("value");
  });

  await t.step("handles null value", () => {
    const result = createGetResult(null);
    expectRedisResult(result).ok().data(null);
  });
});

Deno.test("expectRedisResult with SetResult", async (t) => {
  await t.step("returns correct expectation for set result", () => {
    const result = createSetResult();
    expectRedisResult(result).ok().data("OK");
  });
});

Deno.test("expectRedisResult with HashResult", async (t) => {
  await t.step("returns correct expectation for hash result", () => {
    const result = createHashResult({ foo: "bar", baz: "qux" });
    expectRedisResult(result).ok().dataMatch((v) => {
      assertEquals(v.foo, "bar");
      assertEquals(v.baz, "qux");
    });
  });
});

Deno.test("expectRedisResult with CountResult", async (t) => {
  await t.step("count() passes when counts match", () => {
    const result = createCountResult(5);
    expectRedisResult(result).count(5);
  });

  await t.step("count() throws when counts don't match", () => {
    const result = createCountResult(3);
    assertThrows(
      () => expectRedisResult(result).count(5),
      Error,
      "Expected count 5",
    );
  });

  await t.step("countAtLeast() passes when count is at least min", () => {
    const result = createCountResult(5);
    expectRedisResult(result).countAtLeast(3);
  });

  await t.step("countAtLeast() throws when count is less than min", () => {
    const result = createCountResult(2);
    assertThrows(
      () => expectRedisResult(result).countAtLeast(3),
      Error,
      "Expected count >= 3",
    );
  });

  await t.step("countAtMost() passes when count is at most max", () => {
    const result = createCountResult(3);
    expectRedisResult(result).countAtMost(5);
  });

  await t.step("countAtMost() throws when count is greater than max", () => {
    const result = createCountResult(6);
    assertThrows(
      () => expectRedisResult(result).countAtMost(5),
      Error,
      "Expected count <= 5",
    );
  });

  await t.step("inherits base expectations", () => {
    const result = createCountResult(10, true, 50);
    expectRedisResult(result)
      .ok()
      .count(10)
      .countAtLeast(5)
      .countAtMost(15)
      .durationLessThan(100);
  });
});

Deno.test("expectRedisResult with ArrayResult", async (t) => {
  await t.step("noContent() passes when array is empty", () => {
    const result = createArrayResult<string>([]);
    expectRedisResult(result).noContent();
  });

  await t.step("noContent() throws when array is not empty", () => {
    const result = createArrayResult(["a", "b"]);
    assertThrows(
      () => expectRedisResult(result).noContent(),
      Error,
      "Expected empty array",
    );
  });

  await t.step("hasContent() passes when array is not empty", () => {
    const result = createArrayResult(["a"]);
    expectRedisResult(result).hasContent();
  });

  await t.step("hasContent() throws when array is empty", () => {
    const result = createArrayResult<string>([]);
    assertThrows(
      () => expectRedisResult(result).hasContent(),
      Error,
      "Expected non-empty array",
    );
  });

  await t.step("count() passes when counts match", () => {
    const result = createArrayResult(["a", "b", "c"]);
    expectRedisResult(result).count(3);
  });

  await t.step("count() throws when counts don't match", () => {
    const result = createArrayResult(["a", "b"]);
    assertThrows(
      () => expectRedisResult(result).count(3),
      Error,
      "Expected array count 3",
    );
  });

  await t.step("countAtLeast() passes when count is sufficient", () => {
    const result = createArrayResult(["a", "b", "c"]);
    expectRedisResult(result).countAtLeast(2);
  });

  await t.step("countAtLeast() throws when count is insufficient", () => {
    const result = createArrayResult(["a"]);
    assertThrows(
      () => expectRedisResult(result).countAtLeast(2),
      Error,
      "Expected array count >= 2",
    );
  });

  await t.step("countAtMost() passes when count is within limit", () => {
    const result = createArrayResult(["a", "b"]);
    expectRedisResult(result).countAtMost(3);
  });

  await t.step("countAtMost() throws when count exceeds limit", () => {
    const result = createArrayResult(["a", "b", "c", "d"]);
    assertThrows(
      () => expectRedisResult(result).countAtMost(3),
      Error,
      "Expected array count <= 3",
    );
  });

  await t.step("contains() passes when item exists", () => {
    const result = createArrayResult(["a", "b", "c"]);
    expectRedisResult(result).contains("b");
  });

  await t.step("contains() throws when item doesn't exist", () => {
    const result = createArrayResult(["a", "b"]);
    assertThrows(
      () => expectRedisResult(result).contains("c"),
      Error,
      "Expected array to contain",
    );
  });

  await t.step("inherits base expectations", () => {
    const result = createArrayResult(["a", "b", "c"], true, 50);
    expectRedisResult(result)
      .ok()
      .hasContent()
      .count(3)
      .countAtLeast(2)
      .countAtMost(5)
      .contains("b")
      .durationLessThan(100);
  });
});

Deno.test("expectRedisResult type inference", async (t) => {
  await t.step("infers CountResultExpectation for count result", () => {
    const result = createCountResult(5);
    // TypeScript should infer RedisCountResultExpectation
    // which has count(), countAtLeast(), countAtMost() methods
    const expectation = expectRedisResult(result);
    expectation.count(5).countAtLeast(1).countAtMost(10);
  });

  await t.step("infers ArrayResultExpectation for array result", () => {
    const result = createArrayResult(["a", "b"]);
    // TypeScript should infer RedisArrayResultExpectation
    // which has noContent(), hasContent(), count(), countAtLeast(), countAtMost(), etc.
    const expectation = expectRedisResult(result);
    expectation.hasContent().count(2).countAtLeast(1).countAtMost(3).contains(
      "a",
    );
  });

  await t.step("infers base expectation for get result", () => {
    const result = createGetResult("value");
    // TypeScript should infer RedisResultExpectation<string | null>
    const expectation = expectRedisResult(result);
    expectation.ok().data("value");
  });

  await t.step("infers base expectation for set result", () => {
    const result = createSetResult();
    // TypeScript should infer RedisResultExpectation<"OK">
    const expectation = expectRedisResult(result);
    expectation.ok().data("OK");
  });

  await t.step("infers base expectation for hash result", () => {
    const result = createHashResult({ key: "value" });
    // TypeScript should infer RedisResultExpectation<Record<string, string>>
    const expectation = expectRedisResult(result);
    expectation.ok().dataMatch((v) => assertEquals(v.key, "value"));
  });

  await t.step("infers generic expectation for common result", () => {
    const data = { custom: "data" };
    const result = createCommonResult(data);
    // TypeScript should infer RedisResultExpectation<{ custom: string }>
    const expectation = expectRedisResult(result);
    // Use same reference for object comparison since data() uses ===
    expectation.ok().data(data);
  });
});

Deno.test("expectRedisResult error handling", async (t) => {
  await t.step("throws error for unknown result type", () => {
    const unknownResult = {
      type: "redis:unknown",
      ok: true,
      value: "test",
      duration: 10,
    };

    const error = assertThrows(
      // deno-lint-ignore no-explicit-any
      () => expectRedisResult(unknownResult as any),
      Error,
    );
    assertMatch(error.message, /Unknown Redis result type: redis:unknown/);
  });
});
