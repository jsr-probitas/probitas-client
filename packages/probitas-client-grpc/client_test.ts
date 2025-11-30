import { assertEquals, assertInstanceOf, assertRejects } from "@std/assert";
import { createGrpcClient } from "./client.ts";

Deno.test("createGrpcClient", async (t) => {
  await t.step("returns a GrpcClient with the provided config", async () => {
    const config = {
      address: "localhost:50051",
      metadata: { "x-api-key": "test" },
    };
    const client = await createGrpcClient(config);

    assertEquals(client.config.address, "localhost:50051");
    assertEquals(client.config.metadata, { "x-api-key": "test" });

    await client.close();
  });

  await t.step("implements AsyncDisposable", async () => {
    const client = await createGrpcClient({ address: "localhost:50051" });

    assertInstanceOf(client[Symbol.asyncDispose], Function);
    await client[Symbol.asyncDispose]();
  });

  await t.step(
    "throws error when no schema is loaded and method is called",
    async () => {
      const client = await createGrpcClient({ address: "localhost:50051" });

      await assertRejects(
        () => client.call("grpc.test.Service/TestMethod", {}),
        Error,
        "No schema loaded",
      );

      await client.close();
    },
  );

  await t.step("close() is idempotent", async () => {
    const client = await createGrpcClient({ address: "localhost:50051" });

    await client.close();
    await client.close();
  });
});
