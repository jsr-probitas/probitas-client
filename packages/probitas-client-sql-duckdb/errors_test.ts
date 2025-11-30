import { assertEquals, assertInstanceOf } from "@std/assert";
import { SqlError } from "@probitas/client-sql";
import {
  CatalogError,
  convertDuckDbError,
  DuckDbError,
  IoError,
} from "./errors.ts";

Deno.test("DuckDbError", async (t) => {
  await t.step("extends SqlError", () => {
    const error = new DuckDbError("test error");
    assertInstanceOf(error, SqlError);
    assertInstanceOf(error, Error);
  });

  await t.step("has correct properties", () => {
    const error = new DuckDbError("test error", {
      errorType: "PARSER",
    });

    assertEquals(error.name, "DuckDbError");
    assertEquals(error.message, "test error");
    assertEquals(error.kind, "unknown");
    assertEquals(error.errorType, "PARSER");
  });

  await t.step("supports error chaining", () => {
    const cause = new Error("original error");
    const error = new DuckDbError("wrapped", { cause });

    assertEquals(error.cause, cause);
  });
});

Deno.test("IoError", async (t) => {
  await t.step("extends DuckDbError with io duckdbKind", () => {
    const error = new IoError("file not found", {
      errorType: "IO",
    });

    assertInstanceOf(error, DuckDbError);
    assertEquals(error.name, "IoError");
    assertEquals(error.duckdbKind, "io");
    assertEquals(error.errorType, "IO");
  });
});

Deno.test("CatalogError", async (t) => {
  await t.step("extends DuckDbError with catalog duckdbKind", () => {
    const error = new CatalogError("table not found");

    assertInstanceOf(error, DuckDbError);
    assertEquals(error.name, "CatalogError");
    assertEquals(error.duckdbKind, "catalog");
  });
});

Deno.test("convertDuckDbError", async (t) => {
  await t.step("handles non-Error values", () => {
    const error = convertDuckDbError("string error");

    assertInstanceOf(error, DuckDbError);
    assertEquals(error.message, "string error");
    assertEquals(error.kind, "unknown");
  });

  await t.step("converts 'parser error' message to QuerySyntaxError", () => {
    const duckdbError = new Error("Parser Error: syntax error at or near");

    const error = convertDuckDbError(duckdbError);

    assertEquals(error.kind, "query");
  });

  await t.step("converts 'binder error' message to QuerySyntaxError", () => {
    const duckdbError = new Error("Binder Error: could not resolve column");

    const error = convertDuckDbError(duckdbError);

    assertEquals(error.kind, "query");
  });

  await t.step("converts 'catalog error' message to CatalogError", () => {
    const duckdbError = new Error("Catalog Error: table does not exist");

    const error = convertDuckDbError(duckdbError);

    assertInstanceOf(error, CatalogError);
    assertEquals((error as CatalogError).duckdbKind, "catalog");
  });

  await t.step(
    "converts 'table does not exist' message to CatalogError",
    () => {
      const duckdbError = new Error("Table 'users' does not exist");

      const error = convertDuckDbError(duckdbError);

      assertInstanceOf(error, CatalogError);
    },
  );

  await t.step("converts constraint violation to ConstraintError", () => {
    const duckdbError = new Error("Constraint Error: UNIQUE constraint failed");

    const error = convertDuckDbError(duckdbError);

    assertEquals(error.kind, "constraint");
  });

  await t.step("converts foreign key violation to ConstraintError", () => {
    const duckdbError = new Error("Constraint Error: FOREIGN KEY violation");

    const error = convertDuckDbError(duckdbError);

    assertEquals(error.kind, "constraint");
  });

  await t.step("converts io error to IoError", () => {
    const duckdbError = new Error("IO Error: file not found");

    const error = convertDuckDbError(duckdbError);

    assertInstanceOf(error, IoError);
    assertEquals((error as IoError).duckdbKind, "io");
  });

  await t.step("converts permission denied to IoError", () => {
    const duckdbError = new Error("Permission denied: cannot open file");

    const error = convertDuckDbError(duckdbError);

    assertInstanceOf(error, IoError);
  });

  await t.step("preserves cause in converted error", () => {
    const originalError = new Error("Catalog Error: table not found");

    const error = convertDuckDbError(originalError);

    assertEquals(error.cause, originalError);
  });

  await t.step("returns DuckDbError for unknown errors", () => {
    const duckdbError = new Error("Unknown internal error");

    const error = convertDuckDbError(duckdbError);

    assertInstanceOf(error, DuckDbError);
    assertEquals(error.kind, "unknown");
  });
});
