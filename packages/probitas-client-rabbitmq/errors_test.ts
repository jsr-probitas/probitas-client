import { assertEquals, assertInstanceOf } from "@std/assert";
import { ClientError } from "@probitas/client";
import {
  RabbitMqChannelError,
  RabbitMqConnectionError,
  RabbitMqError,
  RabbitMqNotFoundError,
  RabbitMqPreconditionFailedError,
} from "./errors.ts";

Deno.test("RabbitMqError", async (t) => {
  await t.step("extends ClientError", () => {
    const error = new RabbitMqError("test message");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RabbitMqError);
  });

  await t.step("has correct name and kind", () => {
    const error = new RabbitMqError("test message");
    assertEquals(error.name, "RabbitMqError");
    assertEquals(error.kind, "rabbitmq");
    assertEquals(error.message, "test message");
  });

  await t.step("supports code option", () => {
    const error = new RabbitMqError("test message", "rabbitmq", { code: 404 });
    assertEquals(error.code, 404);
  });

  await t.step("supports cause option", () => {
    const cause = new Error("original");
    const error = new RabbitMqError("wrapped", "rabbitmq", { cause });
    assertEquals(error.cause, cause);
  });
});

Deno.test("RabbitMqConnectionError", async (t) => {
  await t.step("extends RabbitMqError", () => {
    const error = new RabbitMqConnectionError("connection failed");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RabbitMqError);
    assertInstanceOf(error, RabbitMqConnectionError);
  });

  await t.step("has correct name and kind", () => {
    const error = new RabbitMqConnectionError("connection failed");
    assertEquals(error.name, "RabbitMqConnectionError");
    assertEquals(error.kind, "connection");
    assertEquals(error.message, "connection failed");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("ECONNREFUSED");
    const error = new RabbitMqConnectionError("connection failed", { cause });
    assertEquals(error.cause, cause);
  });
});

Deno.test("RabbitMqChannelError", async (t) => {
  await t.step("extends RabbitMqError", () => {
    const error = new RabbitMqChannelError("channel failed");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RabbitMqError);
    assertInstanceOf(error, RabbitMqChannelError);
  });

  await t.step("has correct name and kind", () => {
    const error = new RabbitMqChannelError("channel failed");
    assertEquals(error.name, "RabbitMqChannelError");
    assertEquals(error.kind, "channel");
    assertEquals(error.message, "channel failed");
  });

  await t.step("supports channelId option", () => {
    const error = new RabbitMqChannelError("channel failed", { channelId: 1 });
    assertEquals(error.channelId, 1);
  });

  await t.step("supports cause option", () => {
    const cause = new Error("channel closed");
    const error = new RabbitMqChannelError("channel failed", {
      channelId: 2,
      cause,
    });
    assertEquals(error.cause, cause);
    assertEquals(error.channelId, 2);
  });
});

Deno.test("RabbitMqNotFoundError", async (t) => {
  await t.step("extends RabbitMqError", () => {
    const error = new RabbitMqNotFoundError("queue not found", {
      resource: "my-queue",
    });
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RabbitMqError);
    assertInstanceOf(error, RabbitMqNotFoundError);
  });

  await t.step("has correct name, kind, and resource", () => {
    const error = new RabbitMqNotFoundError("queue not found", {
      resource: "my-queue",
    });
    assertEquals(error.name, "RabbitMqNotFoundError");
    assertEquals(error.kind, "not_found");
    assertEquals(error.message, "queue not found");
    assertEquals(error.resource, "my-queue");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("NOT_FOUND");
    const error = new RabbitMqNotFoundError("queue not found", {
      resource: "my-queue",
      cause,
    });
    assertEquals(error.cause, cause);
    assertEquals(error.resource, "my-queue");
  });
});

Deno.test("RabbitMqPreconditionFailedError", async (t) => {
  await t.step("extends RabbitMqError", () => {
    const error = new RabbitMqPreconditionFailedError("precondition failed", {
      reason: "queue properties mismatch",
    });
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RabbitMqError);
    assertInstanceOf(error, RabbitMqPreconditionFailedError);
  });

  await t.step("has correct name, kind, and reason", () => {
    const error = new RabbitMqPreconditionFailedError("precondition failed", {
      reason: "queue properties mismatch",
    });
    assertEquals(error.name, "RabbitMqPreconditionFailedError");
    assertEquals(error.kind, "precondition_failed");
    assertEquals(error.message, "precondition failed");
    assertEquals(error.reason, "queue properties mismatch");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("PRECONDITION_FAILED");
    const error = new RabbitMqPreconditionFailedError("precondition failed", {
      reason: "durable mismatch",
      cause,
    });
    assertEquals(error.cause, cause);
    assertEquals(error.reason, "durable mismatch");
  });
});
