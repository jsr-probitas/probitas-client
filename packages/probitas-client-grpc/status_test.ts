import { assertEquals } from "@std/assert";
import { getStatusName, GrpcStatus, type GrpcStatusCode } from "./status.ts";

Deno.test("GrpcStatus", async (t) => {
  await t.step("has correct numeric values", () => {
    assertEquals(GrpcStatus.OK, 0);
    assertEquals(GrpcStatus.CANCELLED, 1);
    assertEquals(GrpcStatus.UNKNOWN, 2);
    assertEquals(GrpcStatus.INVALID_ARGUMENT, 3);
    assertEquals(GrpcStatus.DEADLINE_EXCEEDED, 4);
    assertEquals(GrpcStatus.NOT_FOUND, 5);
    assertEquals(GrpcStatus.ALREADY_EXISTS, 6);
    assertEquals(GrpcStatus.PERMISSION_DENIED, 7);
    assertEquals(GrpcStatus.RESOURCE_EXHAUSTED, 8);
    assertEquals(GrpcStatus.FAILED_PRECONDITION, 9);
    assertEquals(GrpcStatus.ABORTED, 10);
    assertEquals(GrpcStatus.OUT_OF_RANGE, 11);
    assertEquals(GrpcStatus.UNIMPLEMENTED, 12);
    assertEquals(GrpcStatus.INTERNAL, 13);
    assertEquals(GrpcStatus.UNAVAILABLE, 14);
    assertEquals(GrpcStatus.DATA_LOSS, 15);
    assertEquals(GrpcStatus.UNAUTHENTICATED, 16);
  });
});

Deno.test("getStatusName", async (t) => {
  await t.step("returns correct name for each status code", () => {
    const testCases: [GrpcStatusCode, string][] = [
      [0, "OK"],
      [1, "CANCELLED"],
      [2, "UNKNOWN"],
      [3, "INVALID_ARGUMENT"],
      [4, "DEADLINE_EXCEEDED"],
      [5, "NOT_FOUND"],
      [6, "ALREADY_EXISTS"],
      [7, "PERMISSION_DENIED"],
      [8, "RESOURCE_EXHAUSTED"],
      [9, "FAILED_PRECONDITION"],
      [10, "ABORTED"],
      [11, "OUT_OF_RANGE"],
      [12, "UNIMPLEMENTED"],
      [13, "INTERNAL"],
      [14, "UNAVAILABLE"],
      [15, "DATA_LOSS"],
      [16, "UNAUTHENTICATED"],
    ];

    for (const [code, expectedName] of testCases) {
      assertEquals(getStatusName(code), expectedName);
    }
  });
});
