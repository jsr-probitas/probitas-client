/**
 * RabbitMQ client for [Probitas](https://github.com/jsr-probitas/probitas) scenario testing framework.
 *
 * This package provides a RabbitMQ client with fluent assertion APIs, designed for
 * integration testing of message-driven applications.
 *
 * ## Features
 *
 * - **Queue Operations**: Declare, bind, purge, and delete queues
 * - **Exchange Operations**: Declare and delete exchanges (direct, topic, fanout, headers)
 * - **Publishing**: Publish messages with routing keys and headers
 * - **Consuming**: Consume messages with acknowledgment support
 * - **Fluent Assertions**: `expectRabbitMqResult()` for testing message operations
 * - **Resource Management**: Implements `AsyncDisposable` for proper cleanup
 *
 * ## Installation
 *
 * ```bash
 * deno add jsr:@probitas/client-rabbitmq
 * ```
 *
 * ## Quick Start
 *
 * ```ts
 * import { createRabbitMqClient, expectRabbitMqResult } from "@probitas/client-rabbitmq";
 *
 * const client = await createRabbitMqClient({
 *   url: "amqp://localhost:5672",
 * });
 *
 * // Create a channel
 * const channel = await client.createChannel();
 *
 * // Declare a queue
 * const queueResult = await channel.assertQueue("test-queue", { durable: true });
 * expectRabbitMqResult(queueResult).ok();
 *
 * // Publish a message
 * const publishResult = await channel.publish("", "test-queue", "Hello, World!", {
 *   contentType: "text/plain",
 * });
 * expectRabbitMqResult(publishResult).ok();
 *
 * // Consume messages
 * const consumeResult = await channel.consume("test-queue", async (msg) => {
 *   console.log("Received:", msg.content);
 *   await channel.ack(msg);
 * });
 *
 * await client.close();
 * ```
 *
 * ## Exchange and Binding
 *
 * ```ts
 * // Declare an exchange
 * await channel.assertExchange("events", "topic", { durable: true });
 *
 * // Declare a queue and bind to exchange
 * await channel.assertQueue("user-events");
 * await channel.bindQueue("user-events", "events", "user.*");
 *
 * // Publish to exchange with routing key
 * await channel.publish("events", "user.created", JSON.stringify({ id: 1, name: "Alice" }), {
 *   contentType: "application/json",
 * });
 * ```
 *
 * ## Using with `using` Statement
 *
 * ```ts
 * await using client = await createRabbitMqClient({ url: "amqp://localhost:5672" });
 * const channel = await client.createChannel();
 *
 * await channel.assertQueue("test");
 * // Client automatically closed when block exits
 * ```
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [`@probitas/client`](https://jsr.io/@probitas/client) | Core utilities and types |
 * | [`@probitas/client-sqs`](https://jsr.io/@probitas/client-sqs) | AWS SQS client |
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas-client)
 * - [Probitas Framework](https://github.com/jsr-probitas/probitas)
 * - [RabbitMQ](https://www.rabbitmq.com/)
 *
 * @module
 */

export type * from "./types.ts";
export * from "./errors.ts";
export * from "./client.ts";
export * from "./expect.ts";
