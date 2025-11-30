import { assertEquals, assertInstanceOf } from "@std/assert";
import { ClientError } from "@probitas/client";
import {
  HttpBadRequestError,
  HttpConflictError,
  HttpError,
  HttpForbiddenError,
  HttpInternalServerError,
  HttpNotFoundError,
  HttpTooManyRequestsError,
  HttpUnauthorizedError,
} from "./errors.ts";

Deno.test("HttpError", async (t) => {
  await t.step("extends ClientError", () => {
    const error = new HttpError("request failed", 500, "Internal Server Error");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, HttpError);
  });

  await t.step("has correct properties", () => {
    const error = new HttpError("request failed", 404, "Not Found");
    assertEquals(error.name, "HttpError");
    assertEquals(error.kind, "http");
    assertEquals(error.message, "request failed");
    assertEquals(error.status, 404);
    assertEquals(error.statusText, "Not Found");
    assertEquals(error.response, undefined);
  });

  await t.step("supports response property", () => {
    const mockResponse = { status: 500 } as never;
    const error = new HttpError(
      "request failed",
      500,
      "Internal Server Error",
      {
        response: mockResponse,
      },
    );
    assertEquals(error.response, mockResponse);
  });

  await t.step("supports cause option", () => {
    const cause = new Error("network error");
    const error = new HttpError(
      "request failed",
      500,
      "Internal Server Error",
      {
        cause,
      },
    );
    assertEquals(error.cause, cause);
  });
});

Deno.test("HttpBadRequestError", async (t) => {
  await t.step("extends HttpError", () => {
    const error = new HttpBadRequestError("bad request");
    assertInstanceOf(error, HttpError);
    assertInstanceOf(error, HttpBadRequestError);
  });

  await t.step("has status 400", () => {
    const error = new HttpBadRequestError("bad request");
    assertEquals(error.name, "HttpBadRequestError");
    assertEquals(error.status, 400);
    assertEquals(error.statusText, "Bad Request");
  });
});

Deno.test("HttpUnauthorizedError", async (t) => {
  await t.step("extends HttpError", () => {
    const error = new HttpUnauthorizedError("unauthorized");
    assertInstanceOf(error, HttpError);
    assertInstanceOf(error, HttpUnauthorizedError);
  });

  await t.step("has status 401", () => {
    const error = new HttpUnauthorizedError("unauthorized");
    assertEquals(error.name, "HttpUnauthorizedError");
    assertEquals(error.status, 401);
    assertEquals(error.statusText, "Unauthorized");
  });
});

Deno.test("HttpForbiddenError", async (t) => {
  await t.step("extends HttpError", () => {
    const error = new HttpForbiddenError("forbidden");
    assertInstanceOf(error, HttpError);
    assertInstanceOf(error, HttpForbiddenError);
  });

  await t.step("has status 403", () => {
    const error = new HttpForbiddenError("forbidden");
    assertEquals(error.name, "HttpForbiddenError");
    assertEquals(error.status, 403);
    assertEquals(error.statusText, "Forbidden");
  });
});

Deno.test("HttpNotFoundError", async (t) => {
  await t.step("extends HttpError", () => {
    const error = new HttpNotFoundError("not found");
    assertInstanceOf(error, HttpError);
    assertInstanceOf(error, HttpNotFoundError);
  });

  await t.step("has status 404", () => {
    const error = new HttpNotFoundError("not found");
    assertEquals(error.name, "HttpNotFoundError");
    assertEquals(error.status, 404);
    assertEquals(error.statusText, "Not Found");
  });
});

Deno.test("HttpConflictError", async (t) => {
  await t.step("extends HttpError", () => {
    const error = new HttpConflictError("conflict");
    assertInstanceOf(error, HttpError);
    assertInstanceOf(error, HttpConflictError);
  });

  await t.step("has status 409", () => {
    const error = new HttpConflictError("conflict");
    assertEquals(error.name, "HttpConflictError");
    assertEquals(error.status, 409);
    assertEquals(error.statusText, "Conflict");
  });
});

Deno.test("HttpTooManyRequestsError", async (t) => {
  await t.step("extends HttpError", () => {
    const error = new HttpTooManyRequestsError("rate limited");
    assertInstanceOf(error, HttpError);
    assertInstanceOf(error, HttpTooManyRequestsError);
  });

  await t.step("has status 429", () => {
    const error = new HttpTooManyRequestsError("rate limited");
    assertEquals(error.name, "HttpTooManyRequestsError");
    assertEquals(error.status, 429);
    assertEquals(error.statusText, "Too Many Requests");
  });
});

Deno.test("HttpInternalServerError", async (t) => {
  await t.step("extends HttpError", () => {
    const error = new HttpInternalServerError("server error");
    assertInstanceOf(error, HttpError);
    assertInstanceOf(error, HttpInternalServerError);
  });

  await t.step("has status 500", () => {
    const error = new HttpInternalServerError("server error");
    assertEquals(error.name, "HttpInternalServerError");
    assertEquals(error.status, 500);
    assertEquals(error.statusText, "Internal Server Error");
  });
});
