import { assertRejects } from "@std/assert";
import { MongoConnectionError } from "./errors.ts";

Deno.test("createMongoClient", async (t) => {
  await t.step(
    "throws MongoConnectionError when connection fails",
    async () => {
      const { createMongoClient } = await import("./client.ts");
      await assertRejects(
        async () => {
          await createMongoClient({
            url: "mongodb://invalid-host:27017",
            database: "test",
            timeout: 100,
          });
        },
        MongoConnectionError,
        "Failed to connect to MongoDB",
      );
    },
  );
});
