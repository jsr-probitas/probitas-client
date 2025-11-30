import { assertEquals, assertThrows } from "@std/assert";
import type {
  MongoDeleteResult,
  MongoFindResult,
  MongoInsertManyResult,
  MongoInsertOneResult,
  MongoUpdateResult,
} from "./types.ts";
import {
  expectMongoDeleteResult,
  expectMongoFindResult,
  expectMongoInsertResult,
  expectMongoUpdateResult,
} from "./expect.ts";
import { createMongoDocs } from "./results.ts";

function createFindResult<T>(
  docs: T[],
  ok = true,
  duration = 10,
): MongoFindResult<T> {
  return { ok, docs: createMongoDocs(docs), duration };
}

function createInsertOneResult(
  insertedId: string,
  ok = true,
  duration = 10,
): MongoInsertOneResult {
  return { ok, insertedId, duration };
}

function createInsertManyResult(
  insertedIds: string[],
  ok = true,
  duration = 10,
): MongoInsertManyResult {
  return { ok, insertedIds, insertedCount: insertedIds.length, duration };
}

function createUpdateResult(
  matchedCount: number,
  modifiedCount: number,
  ok = true,
  duration = 10,
  upsertedId?: string,
): MongoUpdateResult {
  return { ok, matchedCount, modifiedCount, upsertedId, duration };
}

function createDeleteResult(
  deletedCount: number,
  ok = true,
  duration = 10,
): MongoDeleteResult {
  return { ok, deletedCount, duration };
}

Deno.test("expectMongoFindResult", async (t) => {
  await t.step("ok() passes when ok is true", () => {
    const result = createFindResult([{ id: 1 }]);
    expectMongoFindResult(result).ok();
  });

  await t.step("ok() throws when ok is false", () => {
    const result = createFindResult([{ id: 1 }], false);
    assertThrows(
      () => expectMongoFindResult(result).ok(),
      Error,
      "Expected ok result",
    );
  });

  await t.step("notOk() passes when ok is false", () => {
    const result = createFindResult([{ id: 1 }], false);
    expectMongoFindResult(result).notOk();
  });

  await t.step("notOk() throws when ok is true", () => {
    const result = createFindResult([{ id: 1 }]);
    assertThrows(
      () => expectMongoFindResult(result).notOk(),
      Error,
      "Expected not ok result",
    );
  });

  await t.step("noContent() passes when no documents", () => {
    const result = createFindResult<{ id: number }>([]);
    expectMongoFindResult(result).noContent();
  });

  await t.step("noContent() throws when documents exist", () => {
    const result = createFindResult([{ id: 1 }]);
    assertThrows(
      () => expectMongoFindResult(result).noContent(),
      Error,
      "Expected no documents",
    );
  });

  await t.step("hasContent() passes when documents exist", () => {
    const result = createFindResult([{ id: 1 }]);
    expectMongoFindResult(result).hasContent();
  });

  await t.step("hasContent() throws when no documents", () => {
    const result = createFindResult<{ id: number }>([]);
    assertThrows(
      () => expectMongoFindResult(result).hasContent(),
      Error,
      "Expected documents",
    );
  });

  await t.step("docs() passes when count matches", () => {
    const result = createFindResult([{ id: 1 }, { id: 2 }]);
    expectMongoFindResult(result).docs(2);
  });

  await t.step("docs() throws when count doesn't match", () => {
    const result = createFindResult([{ id: 1 }]);
    assertThrows(
      () => expectMongoFindResult(result).docs(2),
      Error,
      "Expected 2 documents",
    );
  });

  await t.step("docsAtLeast() passes when count is sufficient", () => {
    const result = createFindResult([{ id: 1 }, { id: 2 }, { id: 3 }]);
    expectMongoFindResult(result).docsAtLeast(2);
  });

  await t.step("docsAtLeast() throws when count is insufficient", () => {
    const result = createFindResult([{ id: 1 }]);
    assertThrows(
      () => expectMongoFindResult(result).docsAtLeast(2),
      Error,
      "Expected at least 2 documents",
    );
  });

  await t.step("docsAtMost() passes when count is within limit", () => {
    const result = createFindResult([{ id: 1 }, { id: 2 }]);
    expectMongoFindResult(result).docsAtMost(3);
  });

  await t.step("docsAtMost() throws when count exceeds limit", () => {
    const result = createFindResult([{ id: 1 }, { id: 2 }, { id: 3 }]);
    assertThrows(
      () => expectMongoFindResult(result).docsAtMost(2),
      Error,
      "Expected at most 2 documents",
    );
  });

  await t.step("docContains() passes when subset matches", () => {
    const result = createFindResult([
      { id: 1, name: "Alice", age: 30 },
      { id: 2, name: "Bob", age: 25 },
    ]);
    expectMongoFindResult(result).docContains({ name: "Alice" });
  });

  await t.step("docContains() throws when no document matches", () => {
    const result = createFindResult([
      { id: 1, name: "Alice" },
      { id: 2, name: "Bob" },
    ]);
    assertThrows(
      () => expectMongoFindResult(result).docContains({ name: "Charlie" }),
      Error,
      "Expected at least one document to contain",
    );
  });

  await t.step("docMatch() calls matcher with docs", () => {
    const result = createFindResult([{ id: 1 }, { id: 2 }]);
    let called = false;
    expectMongoFindResult(result).docMatch((docs) => {
      assertEquals(docs.length, 2);
      assertEquals(docs.first(), { id: 1 });
      called = true;
    });
    assertEquals(called, true);
  });

  await t.step("durationLessThan() passes when duration is less", () => {
    const result = createFindResult([{ id: 1 }], true, 50);
    expectMongoFindResult(result).durationLessThan(100);
  });

  await t.step("durationLessThan() throws when duration is greater", () => {
    const result = createFindResult([{ id: 1 }], true, 150);
    assertThrows(
      () => expectMongoFindResult(result).durationLessThan(100),
      Error,
      "Expected duration",
    );
  });

  await t.step("methods can be chained", () => {
    const result = createFindResult([{ id: 1, name: "Alice" }], true, 50);
    expectMongoFindResult(result)
      .ok()
      .hasContent()
      .docs(1)
      .docsAtLeast(1)
      .docContains({ name: "Alice" })
      .durationLessThan(100);
  });
});

Deno.test("expectMongoInsertResult", async (t) => {
  await t.step("ok() passes for insertOne result", () => {
    const result = createInsertOneResult("abc123");
    expectMongoInsertResult(result).ok();
  });

  await t.step("ok() passes for insertMany result", () => {
    const result = createInsertManyResult(["a", "b", "c"]);
    expectMongoInsertResult(result).ok();
  });

  await t.step("notOk() passes when ok is false", () => {
    const result = createInsertOneResult("abc123", false);
    expectMongoInsertResult(result).notOk();
  });

  await t.step("insertedCount() passes for insertOne", () => {
    const result = createInsertOneResult("abc123");
    expectMongoInsertResult(result).insertedCount(1);
  });

  await t.step("insertedCount() passes for insertMany", () => {
    const result = createInsertManyResult(["a", "b", "c"]);
    expectMongoInsertResult(result).insertedCount(3);
  });

  await t.step("insertedCount() throws when count doesn't match", () => {
    const result = createInsertManyResult(["a", "b"]);
    assertThrows(
      () => expectMongoInsertResult(result).insertedCount(3),
      Error,
      "Expected 3 inserted documents",
    );
  });

  await t.step("hasInsertedId() passes for insertOne", () => {
    const result = createInsertOneResult("abc123");
    expectMongoInsertResult(result).hasInsertedId();
  });

  await t.step("hasInsertedId() passes for insertMany", () => {
    const result = createInsertManyResult(["a", "b"]);
    expectMongoInsertResult(result).hasInsertedId();
  });

  await t.step("hasInsertedId() throws for empty insertOne", () => {
    const result = createInsertOneResult("");
    assertThrows(
      () => expectMongoInsertResult(result).hasInsertedId(),
      Error,
      "Expected insertedId",
    );
  });

  await t.step("hasInsertedId() throws for empty insertMany", () => {
    const result = createInsertManyResult([]);
    assertThrows(
      () => expectMongoInsertResult(result).hasInsertedId(),
      Error,
      "Expected insertedIds",
    );
  });

  await t.step("durationLessThan() works", () => {
    const result = createInsertOneResult("abc123", true, 50);
    expectMongoInsertResult(result).durationLessThan(100);
  });
});

Deno.test("expectMongoUpdateResult", async (t) => {
  await t.step("ok() passes when ok is true", () => {
    const result = createUpdateResult(1, 1);
    expectMongoUpdateResult(result).ok();
  });

  await t.step("notOk() passes when ok is false", () => {
    const result = createUpdateResult(0, 0, false);
    expectMongoUpdateResult(result).notOk();
  });

  await t.step("matchedCount() passes when count matches", () => {
    const result = createUpdateResult(5, 3);
    expectMongoUpdateResult(result).matchedCount(5);
  });

  await t.step("matchedCount() throws when count doesn't match", () => {
    const result = createUpdateResult(2, 1);
    assertThrows(
      () => expectMongoUpdateResult(result).matchedCount(5),
      Error,
      "Expected 5 matched documents",
    );
  });

  await t.step("modifiedCount() passes when count matches", () => {
    const result = createUpdateResult(5, 3);
    expectMongoUpdateResult(result).modifiedCount(3);
  });

  await t.step("modifiedCount() throws when count doesn't match", () => {
    const result = createUpdateResult(5, 1);
    assertThrows(
      () => expectMongoUpdateResult(result).modifiedCount(5),
      Error,
      "Expected 5 modified documents",
    );
  });

  await t.step("wasUpserted() passes when upsertedId exists", () => {
    const result = createUpdateResult(0, 0, true, 10, "new123");
    expectMongoUpdateResult(result).wasUpserted();
  });

  await t.step("wasUpserted() throws when no upsert", () => {
    const result = createUpdateResult(1, 1);
    assertThrows(
      () => expectMongoUpdateResult(result).wasUpserted(),
      Error,
      "Expected upsert",
    );
  });

  await t.step("methods can be chained", () => {
    const result = createUpdateResult(3, 2, true, 50);
    expectMongoUpdateResult(result)
      .ok()
      .matchedCount(3)
      .modifiedCount(2)
      .durationLessThan(100);
  });
});

Deno.test("expectMongoDeleteResult", async (t) => {
  await t.step("ok() passes when ok is true", () => {
    const result = createDeleteResult(5);
    expectMongoDeleteResult(result).ok();
  });

  await t.step("notOk() passes when ok is false", () => {
    const result = createDeleteResult(0, false);
    expectMongoDeleteResult(result).notOk();
  });

  await t.step("deletedCount() passes when count matches", () => {
    const result = createDeleteResult(5);
    expectMongoDeleteResult(result).deletedCount(5);
  });

  await t.step("deletedCount() throws when count doesn't match", () => {
    const result = createDeleteResult(2);
    assertThrows(
      () => expectMongoDeleteResult(result).deletedCount(5),
      Error,
      "Expected 5 deleted documents",
    );
  });

  await t.step("deletedAtLeast() passes when count is sufficient", () => {
    const result = createDeleteResult(5);
    expectMongoDeleteResult(result).deletedAtLeast(3);
  });

  await t.step("deletedAtLeast() throws when count is insufficient", () => {
    const result = createDeleteResult(2);
    assertThrows(
      () => expectMongoDeleteResult(result).deletedAtLeast(5),
      Error,
      "Expected at least 5 deleted documents",
    );
  });

  await t.step("methods can be chained", () => {
    const result = createDeleteResult(10, true, 50);
    expectMongoDeleteResult(result)
      .ok()
      .deletedCount(10)
      .deletedAtLeast(5)
      .durationLessThan(100);
  });
});
