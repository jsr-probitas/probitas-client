/**
 * AWS SQS client for [Probitas](https://github.com/jsr-probitas/probitas) scenario testing framework.
 *
 * This package provides an AWS SQS client with fluent assertion APIs, designed for
 * integration testing of message-driven applications using Amazon Simple Queue Service.
 *
 * ## Features
 *
 * - **Queue Management**: Create, delete, and purge queues
 * - **Message Operations**: Send, receive, and delete messages (single and batch)
 * - **Message Attributes**: Support for custom message attributes
 * - **Fluent Assertions**: `expectSqsResult()` for testing SQS operations
 * - **LocalStack Compatible**: Works with LocalStack for local development
 * - **Resource Management**: Implements `AsyncDisposable` for proper cleanup
 *
 * ## Installation
 *
 * ```bash
 * deno add jsr:@probitas/client-sqs
 * ```
 *
 * ## Quick Start
 *
 * ```ts
 * import { createSqsClient, expectSqsResult } from "@probitas/client-sqs";
 *
 * const client = await createSqsClient({
 *   region: "us-east-1",
 *   url: "http://localhost:4566", // LocalStack
 *   credentials: {
 *     accessKeyId: "test",
 *     secretAccessKey: "test",
 *   },
 * });
 *
 * // Ensure queue exists
 * const queueResult = await client.ensureQueue("test-queue");
 * expectSqsResult(queueResult).ok();
 * const queueUrl = queueResult.queueUrl;
 *
 * // Send a message
 * const sendResult = await client.send(queueUrl, "Hello, World!", {
 *   attributes: {
 *     type: { dataType: "String", stringValue: "greeting" },
 *   },
 * });
 * expectSqsResult(sendResult).ok().hasMessageId();
 *
 * // Receive messages
 * const receiveResult = await client.receive(queueUrl, {
 *   maxMessages: 10,
 *   waitTimeSeconds: 5,
 * });
 * expectSqsResult(receiveResult).ok().countAtLeast(1);
 *
 * // Delete message after processing
 * for (const msg of receiveResult.messages) {
 *   await client.delete(queueUrl, msg.receiptHandle);
 * }
 *
 * await client.close();
 * ```
 *
 * ## Batch Operations
 *
 * ```ts
 * // Send batch messages
 * const batchSend = await client.sendBatch(queueUrl, [
 *   { body: "Message 1", id: "msg-1" },
 *   { body: "Message 2", id: "msg-2" },
 *   { body: "Message 3", id: "msg-3" },
 * ]);
 * expectSqsResult(batchSend).ok();
 *
 * // Delete batch messages
 * const messages = await client.receive(queueUrl, { maxMessages: 10 });
 * const batchDelete = await client.deleteBatch(
 *   queueUrl,
 *   messages.messages.map((m, i) => ({ id: `del-${i}`, receiptHandle: m.receiptHandle }))
 * );
 * expectSqsResult(batchDelete).ok();
 * ```
 *
 * ## Using with `using` Statement
 *
 * ```ts
 * await using client = await createSqsClient({
 *   region: "us-east-1",
 *   url: "http://localhost:4566",
 * });
 *
 * const queue = await client.ensureQueue("test");
 * // Client automatically closed when block exits
 * ```
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [`@probitas/client`](https://jsr.io/@probitas/client) | Core utilities and types |
 * | [`@probitas/client-rabbitmq`](https://jsr.io/@probitas/client-rabbitmq) | RabbitMQ client |
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas-client)
 * - [Probitas Framework](https://github.com/jsr-probitas/probitas)
 * - [AWS SQS](https://aws.amazon.com/sqs/)
 * - [LocalStack](https://localstack.cloud/)
 *
 * @module
 */

export type * from "./types.ts";
export * from "./errors.ts";
export * from "./client.ts";
export * from "./messages.ts";
export * from "./expect.ts";
