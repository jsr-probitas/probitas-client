/**
 * Tests for expect API.
 */

import { assertThrows } from "@std/assert";
import { ConnectRpcResponseImpl } from "./response.ts";
import { expectConnectRpcResponse } from "./expect.ts";

Deno.test("expect - ok() passes for code 0", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).ok();
});

Deno.test("expect - ok() throws for non-zero code", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5,
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  assertThrows(
    () => expectConnectRpcResponse(response).ok(),
    Error,
    "Expected ok response",
  );
});

Deno.test("expect - notOk() passes for non-zero code", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5,
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  expectConnectRpcResponse(response).notOk();
});

Deno.test("expect - notOk() throws for code 0", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () => expectConnectRpcResponse(response).notOk(),
    Error,
    "Expected non-ok response",
  );
});

Deno.test("expect - dataContains() matches subset", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: { message: "hello", extra: "data" },
  });

  expectConnectRpcResponse(response).dataContains({ message: "hello" });
});

Deno.test("expect - dataContains() throws on mismatch", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: { message: "hello" },
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).dataContains({ message: "goodbye" }),
    Error,
    "Expected data to contain",
  );
});

Deno.test("expect - dataContains() matches nested objects", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {
      user: { name: "Alice", age: 30 },
      status: "active",
    },
  });

  expectConnectRpcResponse(response).dataContains({
    user: { name: "Alice" },
  });
});

Deno.test("expect - dataContains() matches deeply nested objects", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {
      data: {
        user: {
          profile: { name: "John", age: 30 },
          settings: { theme: "dark" },
        },
      },
    },
  });

  expectConnectRpcResponse(response).dataContains({
    data: { user: { profile: { name: "John" } } },
  });
});

Deno.test("expect - dataContains() matches nested array elements", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {
      items: [1, 2, 3],
      nested: { values: [10, 20, 30] },
    },
  });

  expectConnectRpcResponse(response).dataContains({ items: [1, 2, 3] });
});

Deno.test("expect - dataContains() throws when nested object does not match", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {
      args: { name: "probitas", version: "1.0" },
    },
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).dataContains({
        args: { name: "different" },
      }),
    Error,
    "Expected data to contain",
  );
});

Deno.test("expect - dataContains() throws when nested property is missing", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {
      args: { version: "1.0" },
    },
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).dataContains({
        args: { name: "test" },
      }),
    Error,
    "Expected data to contain",
  );
});

Deno.test("expect - dataContains() matches mixed nested and top-level properties", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {
      status: "ok",
      data: { message: "Hello", count: 42 },
    },
  });

  expectConnectRpcResponse(response).dataContains({
    status: "ok",
    data: { message: "Hello" },
  });
});

Deno.test("expect - header() matches value", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-type": "application/grpc" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).header(
    "content-type",
    "application/grpc",
  );
});

Deno.test("expect - header() matches regex", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-type": "application/grpc+proto" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).header("content-type", /^application\//);
});

Deno.test("expect - header() throws on mismatch", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-type": "text/plain" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).header(
        "content-type",
        "application/grpc",
      ),
    Error,
    'Expected header "content-type"',
  );
});

Deno.test("expect - headerExists() passes", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "x-custom": "value" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).headerExists("x-custom");
});

Deno.test("expect - headerExists() throws when missing", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () => expectConnectRpcResponse(response).headerExists("x-custom"),
    Error,
    'Expected header "x-custom" to exist',
  );
});

Deno.test("expect - durationLessThan() passes", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 50,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).durationLessThan(100);
});

Deno.test("expect - durationLessThan() throws when exceeded", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 150,
    responseMessage: {},
  });

  assertThrows(
    () => expectConnectRpcResponse(response).durationLessThan(100),
    Error,
    "Expected duration <",
  );
});

Deno.test("expect - method chaining", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-type": "application/grpc" },
    trailers: {},
    duration: 50,
    responseMessage: { status: "success", value: 42 },
  });

  expectConnectRpcResponse(response)
    .ok()
    .status(0)
    .headerExists("content-type")
    .dataContains({ status: "success" })
    .durationLessThan(1000);
});

Deno.test("expect - error response validation", () => {
  const response = new ConnectRpcResponseImpl({
    code: 16, // UNAUTHENTICATED
    message: "invalid token",
    headers: {},
    trailers: {},
    duration: 10,
    responseMessage: null,
  });

  expectConnectRpcResponse(response)
    .notOk()
    .status(16)
    .errorContains("invalid")
    .noContent();
});

Deno.test("expect - statusNotIn() passes when code is not in list", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5, // NOT_FOUND
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  expectConnectRpcResponse(response).statusNotIn(0, 3, 16);
});

Deno.test("expect - statusNotIn() throws when code is in list", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5, // NOT_FOUND
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  assertThrows(
    () => expectConnectRpcResponse(response).statusNotIn(3, 5, 16),
    Error,
    "Expected status to not be one of",
  );
});

Deno.test("expect - statusIn() passes when code is in list", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5, // NOT_FOUND
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  expectConnectRpcResponse(response).statusIn(3, 5, 16);
});

Deno.test("expect - statusIn() throws when code is not in list", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5, // NOT_FOUND
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  assertThrows(
    () => expectConnectRpcResponse(response).statusIn(0, 3, 16),
    Error,
    "Expected status to be one of",
  );
});

Deno.test("expect - headerContains() passes when header contains substring", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-type": "application/grpc+proto" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).headerContains("content-type", "grpc");
});

Deno.test("expect - headerContains() throws when header does not contain substring", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-type": "application/json" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).headerContains("content-type", "grpc"),
    Error,
    'Expected header "content-type" to contain "grpc"',
  );
});

Deno.test("expect - headerContains() throws when header does not exist", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).headerContains("x-missing", "value"),
    Error,
    'Expected header "x-missing" to exist',
  );
});

Deno.test("expect - headerMatch() passes with custom matcher", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-length": "42" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).headerMatch("content-length", (value) => {
    if (parseInt(value) <= 0) {
      throw new Error("Expected positive content-length");
    }
  });
});

Deno.test("expect - headerMatch() throws when matcher fails", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: { "content-length": "0" },
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).headerMatch(
        "content-length",
        (value) => {
          if (parseInt(value) <= 0) {
            throw new Error("Expected positive content-length");
          }
        },
      ),
    Error,
    "Expected positive content-length",
  );
});

Deno.test("expect - headerMatch() throws when header does not exist", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () => expectConnectRpcResponse(response).headerMatch("x-missing", () => {}),
    Error,
    'Expected header "x-missing" to exist',
  );
});

Deno.test("expect - trailer() matches value", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-status": "0" },
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).trailer("grpc-status", "0");
});

Deno.test("expect - trailer() matches regex", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-message": "success-12345" },
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).trailer("grpc-message", /^success-\d+$/);
});

Deno.test("expect - trailer() throws on mismatch", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-status": "1" },
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () => expectConnectRpcResponse(response).trailer("grpc-status", "0"),
    Error,
    'Expected trailer "grpc-status"',
  );
});

Deno.test("expect - trailerExists() passes", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-status": "0" },
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).trailerExists("grpc-status");
});

Deno.test("expect - trailerExists() throws when missing", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () => expectConnectRpcResponse(response).trailerExists("grpc-status"),
    Error,
    'Expected trailer "grpc-status" to exist',
  );
});

Deno.test("expect - trailerContains() passes when trailer contains substring", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-message": "operation successful" },
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).trailerContains(
    "grpc-message",
    "successful",
  );
});

Deno.test("expect - trailerContains() throws when trailer does not contain substring", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-message": "operation failed" },
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).trailerContains(
        "grpc-message",
        "successful",
      ),
    Error,
    'Expected trailer "grpc-message" to contain "successful"',
  );
});

Deno.test("expect - trailerContains() throws when trailer does not exist", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).trailerContains("x-missing", "value"),
    Error,
    'Expected trailer "x-missing" to exist',
  );
});

Deno.test("expect - trailerMatch() passes with custom matcher", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-status": "0" },
    duration: 100,
    responseMessage: {},
  });

  expectConnectRpcResponse(response).trailerMatch("grpc-status", (value) => {
    if (value !== "0") {
      throw new Error("Expected grpc-status to be 0");
    }
  });
});

Deno.test("expect - trailerMatch() throws when matcher fails", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: { "grpc-status": "5" },
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).trailerMatch(
        "grpc-status",
        (value) => {
          if (value !== "0") {
            throw new Error("Expected grpc-status to be 0");
          }
        },
      ),
    Error,
    "Expected grpc-status to be 0",
  );
});

Deno.test("expect - trailerMatch() throws when trailer does not exist", () => {
  const response = new ConnectRpcResponseImpl({
    code: 0,
    message: "",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: {},
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).trailerMatch("x-missing", () => {}),
    Error,
    'Expected trailer "x-missing" to exist',
  );
});

Deno.test("expect - error() matches exact string", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5,
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  expectConnectRpcResponse(response).error("Not found");
});

Deno.test("expect - error() matches regex", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5,
    message: "User with id 123 not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  expectConnectRpcResponse(response).error(/not found$/i);
});

Deno.test("expect - error() throws on mismatch", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5,
    message: "Not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  assertThrows(
    () => expectConnectRpcResponse(response).error("Invalid request"),
    Error,
    'Expected error "Invalid request"',
  );
});

Deno.test("expect - errorMatch() passes with custom matcher", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5,
    message: "Resource not found",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  expectConnectRpcResponse(response).errorMatch((msg) => {
    if (!msg.includes("not found")) {
      throw new Error("Expected error to contain 'not found'");
    }
  });
});

Deno.test("expect - errorMatch() throws when matcher fails", () => {
  const response = new ConnectRpcResponseImpl({
    code: 5,
    message: "Invalid request",
    headers: {},
    trailers: {},
    duration: 100,
    responseMessage: null,
  });

  assertThrows(
    () =>
      expectConnectRpcResponse(response).errorMatch((msg) => {
        if (!msg.includes("not found")) {
          throw new Error("Expected error to contain 'not found'");
        }
      }),
    Error,
    "Expected error to contain 'not found'",
  );
});
