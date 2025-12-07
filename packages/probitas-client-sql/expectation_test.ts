import { assertEquals, assertThrows } from "@std/assert";
import { SqlQueryResult } from "./result.ts";
import { expectSqlQueryResult } from "./expectation.ts";

function createResult<T>(
  rows: T[],
  options: {
    ok?: boolean;
    rowCount?: number;
    duration?: number;
    lastInsertId?: bigint | string;
    warnings?: string[];
  } = {},
): SqlQueryResult<T> {
  return new SqlQueryResult({
    ok: options.ok ?? true,
    rows,
    rowCount: options.rowCount ?? 0,
    duration: options.duration ?? 10,
    metadata: {
      lastInsertId: options.lastInsertId,
      warnings: options.warnings,
    },
  });
}

Deno.test("expectSqlQueryResult", async (t) => {
  await t.step("ok() passes for successful result", () => {
    const result = createResult([{ id: 1 }]);
    expectSqlQueryResult(result).ok();
  });

  await t.step("ok() fails for failed result", () => {
    const result = createResult([], { ok: false });
    assertThrows(
      () => expectSqlQueryResult(result).ok(),
      Error,
      "Expected query to succeed",
    );
  });

  await t.step("notOk() passes for failed result", () => {
    const result = createResult([], { ok: false });
    expectSqlQueryResult(result).notOk();
  });

  await t.step("notOk() fails for successful result", () => {
    const result = createResult([{ id: 1 }]);
    assertThrows(
      () => expectSqlQueryResult(result).notOk(),
      Error,
      "Expected query to fail",
    );
  });

  await t.step("noContent() passes for empty result", () => {
    const result = createResult([]);
    expectSqlQueryResult(result).noContent();
  });

  await t.step("noContent() fails for non-empty result", () => {
    const result = createResult([{ id: 1 }]);
    assertThrows(
      () => expectSqlQueryResult(result).noContent(),
      Error,
      "Expected no rows",
    );
  });

  await t.step("hasContent() passes for non-empty result", () => {
    const result = createResult([{ id: 1 }]);
    expectSqlQueryResult(result).hasContent();
  });

  await t.step("hasContent() fails for empty result", () => {
    const result = createResult([]);
    assertThrows(
      () => expectSqlQueryResult(result).hasContent(),
      Error,
      "Expected rows to be present",
    );
  });

  await t.step("count() passes for exact count", () => {
    const result = createResult([{ id: 1 }, { id: 2 }]);
    expectSqlQueryResult(result).count(2);
  });

  await t.step("count() fails for incorrect count", () => {
    const result = createResult([{ id: 1 }]);
    assertThrows(
      () => expectSqlQueryResult(result).count(2),
      Error,
      "Expected 2 rows, got 1",
    );
  });

  await t.step("countAtLeast() passes for sufficient rows", () => {
    const result = createResult([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expectSqlQueryResult(result).countAtLeast(2);
  });

  await t.step("countAtLeast() fails for insufficient rows", () => {
    const result = createResult([{ id: 1 }]);
    assertThrows(
      () => expectSqlQueryResult(result).countAtLeast(2),
      Error,
      "Expected at least 2 rows, got 1",
    );
  });

  await t.step("countAtMost() passes for acceptable rows", () => {
    const result = createResult([{ id: 1 }]);
    expectSqlQueryResult(result).countAtMost(2);
  });

  await t.step("countAtMost() fails for too many rows", () => {
    const result = createResult([{ id: 1 }, { id: 2 }, { id: 3 }]);
    assertThrows(
      () => expectSqlQueryResult(result).countAtMost(2),
      Error,
      "Expected at most 2 rows, got 3",
    );
  });

  await t.step("rowCount() passes for exact count", () => {
    const result = createResult([], { rowCount: 5 });
    expectSqlQueryResult(result).rowCount(5);
  });

  await t.step("rowCount() fails for incorrect count", () => {
    const result = createResult([], { rowCount: 3 });
    assertThrows(
      () => expectSqlQueryResult(result).rowCount(5),
      Error,
      "Expected rowCount 5, got 3",
    );
  });

  await t.step("rowCountAtLeast() passes for sufficient count", () => {
    const result = createResult([], { rowCount: 5 });
    expectSqlQueryResult(result).rowCountAtLeast(3);
  });

  await t.step("rowCountAtLeast() fails for insufficient count", () => {
    const result = createResult([], { rowCount: 2 });
    assertThrows(
      () => expectSqlQueryResult(result).rowCountAtLeast(3),
      Error,
      "Expected rowCount at least 3, got 2",
    );
  });

  await t.step("rowCountAtMost() passes for acceptable count", () => {
    const result = createResult([], { rowCount: 3 });
    expectSqlQueryResult(result).rowCountAtMost(5);
  });

  await t.step("rowCountAtMost() fails for excessive count", () => {
    const result = createResult([], { rowCount: 10 });
    assertThrows(
      () => expectSqlQueryResult(result).rowCountAtMost(5),
      Error,
      "Expected rowCount at most 5, got 10",
    );
  });

  await t.step("dataContains() passes for matching row", () => {
    const result = createResult([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
    expectSqlQueryResult(result).dataContains({ name: "Alice" });
  });

  await t.step("dataContains() fails for no matching row", () => {
    const result = createResult([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
    assertThrows(
      () => expectSqlQueryResult(result).dataContains({ name: "Charlie" }),
      Error,
      "No row contains the expected subset",
    );
  });

  await t.step("dataMatch() passes for valid matcher", () => {
    const result = createResult([{ id: 1 }, { id: 2 }]);
    expectSqlQueryResult(result).dataMatch((rows) => {
      assertEquals(rows.length, 2);
    });
  });

  await t.step("dataMatch() fails for failing matcher", () => {
    const result = createResult([{ id: 1 }]);
    assertThrows(
      () =>
        expectSqlQueryResult(result).dataMatch((rows) => {
          assertEquals(rows.length, 2);
        }),
      Error,
    );
  });

  await t.step("mapContains() passes for matching mapped row", () => {
    const result = createResult([{ id: 1, firstName: "Alice", lastName: "A" }]);
    expectSqlQueryResult(result).mapContains(
      (row) => ({ fullName: `${row.firstName} ${row.lastName}` }),
      { fullName: "Alice A" },
    );
  });

  await t.step("mapMatch() passes for valid mapped matcher", () => {
    const result = createResult([{ id: 1, value: 10 }, { id: 2, value: 20 }]);
    expectSqlQueryResult(result).mapMatch(
      (row) => row.value * 2,
      (mapped) => {
        assertEquals(mapped, [20, 40]);
      },
    );
  });

  await t.step("asContains() passes for matching instance", () => {
    class User {
      readonly displayName: string;
      constructor(row: { name: string }) {
        this.displayName = `User: ${row.name}`;
      }
    }
    const result = createResult([{ name: "Alice" }]);
    expectSqlQueryResult(result).asContains(User, {
      displayName: "User: Alice",
    });
  });

  await t.step("asMatch() passes for valid instance matcher", () => {
    class User {
      readonly id: number;
      constructor(row: { id: number }) {
        this.id = row.id;
      }
    }
    const result = createResult([{ id: 1 }, { id: 2 }]);
    expectSqlQueryResult(result).asMatch(User, (instances) => {
      assertEquals(instances.map((u) => u.id), [1, 2]);
    });
  });

  await t.step("lastInsertId() passes for matching id", () => {
    const result = createResult([], { lastInsertId: 42n });
    expectSqlQueryResult(result).lastInsertId(42n);
  });

  await t.step("lastInsertId() fails for non-matching id", () => {
    const result = createResult([], { lastInsertId: 42n });
    assertThrows(
      () => expectSqlQueryResult(result).lastInsertId(100n),
      Error,
      "Expected lastInsertId 100, got 42",
    );
  });

  await t.step("hasLastInsertId() passes when present", () => {
    const result = createResult([], { lastInsertId: 1n });
    expectSqlQueryResult(result).hasLastInsertId();
  });

  await t.step("hasLastInsertId() fails when absent", () => {
    const result = createResult([]);
    assertThrows(
      () => expectSqlQueryResult(result).hasLastInsertId(),
      Error,
      "Expected lastInsertId to be present",
    );
  });

  await t.step("durationLessThan() passes for fast query", () => {
    const result = createResult([], { duration: 50 });
    expectSqlQueryResult(result).durationLessThan(100);
  });

  await t.step("durationLessThan() fails for slow query", () => {
    const result = createResult([], { duration: 150 });
    assertThrows(
      () => expectSqlQueryResult(result).durationLessThan(100),
      Error,
      "Expected duration < 100ms, got 150ms",
    );
  });

  await t.step("supports method chaining", () => {
    const result = createResult([{ id: 1, name: "Alice" }], {
      rowCount: 1,
      duration: 10,
      lastInsertId: 1n,
    });
    expectSqlQueryResult(result)
      .ok()
      .hasContent()
      .count(1)
      .rowCount(1)
      .dataContains({ name: "Alice" })
      .hasLastInsertId()
      .durationLessThan(100);
  });
});
