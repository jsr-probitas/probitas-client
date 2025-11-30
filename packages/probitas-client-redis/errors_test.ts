import { assertEquals, assertInstanceOf } from "@std/assert";
import { ClientError } from "@probitas/client";
import {
  RedisCommandError,
  RedisConnectionError,
  RedisError,
  RedisScriptError,
} from "./errors.ts";

Deno.test("RedisError", async (t) => {
  await t.step("extends ClientError", () => {
    const error = new RedisError("test message");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RedisError);
  });

  await t.step("has correct name and kind", () => {
    const error = new RedisError("test message");
    assertEquals(error.name, "RedisError");
    assertEquals(error.kind, "redis");
    assertEquals(error.message, "test message");
  });

  await t.step("supports code option", () => {
    const error = new RedisError("test message", "redis", { code: "ERR" });
    assertEquals(error.code, "ERR");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("original");
    const error = new RedisError("wrapped", "redis", { cause });
    assertEquals(error.cause, cause);
  });
});

Deno.test("RedisConnectionError", async (t) => {
  await t.step("extends RedisError", () => {
    const error = new RedisConnectionError("connection failed");
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RedisError);
    assertInstanceOf(error, RedisConnectionError);
  });

  await t.step("has correct name and kind", () => {
    const error = new RedisConnectionError("connection failed");
    assertEquals(error.name, "RedisConnectionError");
    assertEquals(error.kind, "connection");
    assertEquals(error.message, "connection failed");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("ECONNREFUSED");
    const error = new RedisConnectionError("connection failed", { cause });
    assertEquals(error.cause, cause);
  });
});

Deno.test("RedisCommandError", async (t) => {
  await t.step("extends RedisError", () => {
    const error = new RedisCommandError("command failed", { command: "GET" });
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RedisError);
    assertInstanceOf(error, RedisCommandError);
  });

  await t.step("has correct name, kind, and command", () => {
    const error = new RedisCommandError("command failed", { command: "SET" });
    assertEquals(error.name, "RedisCommandError");
    assertEquals(error.kind, "command");
    assertEquals(error.message, "command failed");
    assertEquals(error.command, "SET");
  });

  await t.step("supports cause option", () => {
    const cause = new Error("wrong type");
    const error = new RedisCommandError("command failed", {
      command: "INCR",
      cause,
    });
    assertEquals(error.cause, cause);
    assertEquals(error.command, "INCR");
  });
});

Deno.test("RedisScriptError", async (t) => {
  await t.step("extends RedisError", () => {
    const error = new RedisScriptError("script failed", {
      script: "return 1",
    });
    assertInstanceOf(error, ClientError);
    assertInstanceOf(error, RedisError);
    assertInstanceOf(error, RedisScriptError);
  });

  await t.step("has correct name, kind, and script", () => {
    const script = "return redis.call('GET', KEYS[1])";
    const error = new RedisScriptError("script failed", { script });
    assertEquals(error.name, "RedisScriptError");
    assertEquals(error.kind, "script");
    assertEquals(error.message, "script failed");
    assertEquals(error.script, script);
  });

  await t.step("supports cause option", () => {
    const cause = new Error("syntax error");
    const error = new RedisScriptError("script failed", {
      script: "invalid",
      cause,
    });
    assertEquals(error.cause, cause);
    assertEquals(error.script, "invalid");
  });
});
