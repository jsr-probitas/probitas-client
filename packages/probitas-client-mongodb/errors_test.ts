import { assertEquals, assertInstanceOf } from "@std/assert";
import { ClientError } from "@probitas/client";
import {
  MongoConnectionError,
  MongoDuplicateKeyError,
  MongoError,
  MongoNotFoundError,
  MongoQueryError,
  MongoValidationError,
  MongoWriteError,
} from "./errors.ts";

Deno.test("MongoError", async (t) => {
  await t.step("extends ClientError", () => {
    const error = new MongoError("test message");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, MongoError);
  });

  await t.step("has correct name and kind", () => {
    const error = new MongoError("test message");
    assertEquals(error.name, "MongoError");
    assertEquals(error.kind, "mongo");
    assertEquals(error.message, "test message");
  });

  await t.step("supports code option", () => {
    const error = new MongoError("test message", "mongo", { code: 11000 });
    assertEquals(error.code, 11000);
  });

  await t.step("supports cause option", () => {
    const cause = new Error("original");
    const error = new MongoError("wrapped", "mongo", { cause });
    assertEquals(error.cause, cause);
  });
});

Deno.test("MongoConnectionError", async (t) => {
  await t.step("extends MongoError", () => {
    const error = new MongoConnectionError("connection failed");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, MongoError);
    assertInstanceOf(error, MongoConnectionError);
  });

  await t.step("has correct name and kind", () => {
    const error = new MongoConnectionError("connection failed");
    assertEquals(error.name, "MongoConnectionError");
    assertEquals(error.kind, "connection");
    assertEquals(error.message, "connection failed");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("ECONNREFUSED");
    const error = new MongoConnectionError("connection failed", { cause });
    assertEquals(error.cause, cause);
  });
});

Deno.test("MongoQueryError", async (t) => {
  await t.step("extends MongoError", () => {
    const error = new MongoQueryError("query failed", "users");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, MongoError);
    assertInstanceOf(error, MongoQueryError);
  });

  await t.step("has correct name, kind, and collection", () => {
    const error = new MongoQueryError("query failed", "users");
    assertEquals(error.name, "MongoQueryError");
    assertEquals(error.kind, "query");
    assertEquals(error.message, "query failed");
    assertEquals(error.collection, "users");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("invalid query");
    const error = new MongoQueryError("query failed", "orders", { cause });
    assertEquals(error.cause, cause);
    assertEquals(error.collection, "orders");
  });
});

Deno.test("MongoDuplicateKeyError", async (t) => {
  await t.step("extends MongoError", () => {
    const error = new MongoDuplicateKeyError(
      "duplicate key",
      { _id: 1 },
      { _id: "abc123" },
    );
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, MongoError);
    assertInstanceOf(error, MongoDuplicateKeyError);
  });

  await t.step("has correct name, kind, and properties", () => {
    const error = new MongoDuplicateKeyError(
      "duplicate key",
      { email: 1 },
      { email: "test@example.com" },
    );
    assertEquals(error.name, "MongoDuplicateKeyError");
    assertEquals(error.kind, "duplicate_key");
    assertEquals(error.code, 11000);
    assertEquals(error.keyPattern, { email: 1 });
    assertEquals(error.keyValue, { email: "test@example.com" });
  });

  await t.step("supports cause option", () => {
    const cause = new Error("E11000");
    const error = new MongoDuplicateKeyError(
      "duplicate key",
      { _id: 1 },
      { _id: "abc" },
      { cause },
    );
    assertEquals(error.cause, cause);
  });
});

Deno.test("MongoValidationError", async (t) => {
  await t.step("extends MongoError", () => {
    const error = new MongoValidationError("validation failed", [
      "name is required",
    ]);
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, MongoError);
    assertInstanceOf(error, MongoValidationError);
  });

  await t.step("has correct name, kind, and validationErrors", () => {
    const errors = ["name is required", "age must be positive"];
    const error = new MongoValidationError("validation failed", errors);
    assertEquals(error.name, "MongoValidationError");
    assertEquals(error.kind, "validation");
    assertEquals(error.validationErrors, errors);
  });
});

Deno.test("MongoWriteError", async (t) => {
  await t.step("extends MongoError", () => {
    const error = new MongoWriteError("write failed", []);
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, MongoError);
    assertInstanceOf(error, MongoWriteError);
  });

  await t.step("has correct name, kind, and writeErrors", () => {
    const writeErrors = [
      { index: 0, code: 11000, message: "duplicate key" },
      { index: 1, code: 121, message: "validation failed" },
    ];
    const error = new MongoWriteError("write failed", writeErrors);
    assertEquals(error.name, "MongoWriteError");
    assertEquals(error.kind, "write");
    assertEquals(error.writeErrors, writeErrors);
  });
});

Deno.test("MongoNotFoundError", async (t) => {
  await t.step("extends MongoError", () => {
    const error = new MongoNotFoundError("not found");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, MongoError);
    assertInstanceOf(error, MongoNotFoundError);
  });

  await t.step("has correct name and kind", () => {
    const error = new MongoNotFoundError("document not found");
    assertEquals(error.name, "MongoNotFoundError");
    assertEquals(error.kind, "not_found");
    assertEquals(error.message, "document not found");
  });
});
