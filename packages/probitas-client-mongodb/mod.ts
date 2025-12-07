/**
 * MongoDB client for [Probitas](https://github.com/jsr-probitas/probitas) scenario testing framework.
 *
 * This package provides a MongoDB client with fluent assertion APIs, designed for
 * integration testing of applications using MongoDB.
 *
 * ## Features
 *
 * - **CRUD Operations**: find, findOne, insertOne, insertMany, updateOne, updateMany, deleteOne, deleteMany
 * - **Aggregations**: Full aggregation pipeline support
 * - **Sessions**: Transaction support with sessions
 * - **Fluent Assertions**: `expectMongoResult()` for testing MongoDB operations
 * - **Type Safety**: Generic type parameters for document types
 * - **Resource Management**: Implements `AsyncDisposable` for proper cleanup
 *
 * ## Installation
 *
 * ```bash
 * deno add jsr:@probitas/client-mongodb
 * ```
 *
 * ## Quick Start
 *
 * ```ts
 * import { createMongoClient, expectMongoResult } from "@probitas/client-mongodb";
 *
 * const client = await createMongoClient({
 *   uri: "mongodb://localhost:27017",
 *   database: "testdb",
 * });
 *
 * // Get a collection
 * const users = client.collection<{ name: string; email: string }>("users");
 *
 * // Insert a document
 * const insertResult = await users.insertOne({ name: "Alice", email: "alice@example.com" });
 * expectMongoResult(insertResult).ok().hasInsertedId();
 *
 * // Find documents
 * const findResult = await users.find({ name: "Alice" });
 * expectMongoResult(findResult).ok().countAtLeast(1);
 *
 * // Find one document
 * const user = await users.findOne({ name: "Alice" });
 * expectMongoResult(user).ok().docContains({ email: "alice@example.com" });
 *
 * await client.close();
 * ```
 *
 * ## Transactions
 *
 * ```ts
 * await client.withSession(async (session) => {
 *   session.startTransaction();
 *   try {
 *     const accounts = client.collection("accounts");
 *     await accounts.updateOne(
 *       { _id: "from" },
 *       { $inc: { balance: -100 } },
 *       { session }
 *     );
 *     await accounts.updateOne(
 *       { _id: "to" },
 *       { $inc: { balance: 100 } },
 *       { session }
 *     );
 *     await session.commitTransaction();
 *   } catch (error) {
 *     await session.abortTransaction();
 *     throw error;
 *   }
 * });
 * ```
 *
 * ## Using with `using` Statement
 *
 * ```ts
 * await using client = await createMongoClient({
 *   uri: "mongodb://localhost:27017",
 *   database: "testdb",
 * });
 *
 * const result = await client.collection("test").findOne({});
 * // Client automatically closed when block exits
 * ```
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [`@probitas/client`](https://jsr.io/@probitas/client) | Core utilities and types |
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas-client)
 * - [Probitas Framework](https://github.com/jsr-probitas/probitas)
 * - [MongoDB](https://www.mongodb.com/)
 *
 * @module
 */

export type * from "./types.ts";
export * from "./errors.ts";
export * from "./results.ts";
export * from "./client.ts";
export * from "./expect.ts";
