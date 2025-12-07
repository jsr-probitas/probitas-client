# @probitas/client-rabbitmq

RabbitMQ client package.

**Depends on**: `@probitas/client`

## RabbitMqResult Types

```typescript
/**
 * Message
 */
interface RabbitMqMessage {
  readonly content: Uint8Array;
  readonly properties: RabbitMqMessageProperties;
  readonly fields: RabbitMqMessageFields;
}

interface RabbitMqMessageProperties {
  readonly contentType?: string;
  readonly contentEncoding?: string;
  readonly headers?: Record<string, unknown>;
  readonly deliveryMode?: 1 | 2; // 1: non-persistent, 2: persistent
  readonly priority?: number;
  readonly correlationId?: string;
  readonly replyTo?: string;
  readonly expiration?: string;
  readonly messageId?: string;
  readonly timestamp?: number;
  readonly type?: string;
  readonly userId?: string;
  readonly appId?: string;
}

interface RabbitMqMessageFields {
  readonly deliveryTag: bigint;
  readonly redelivered: boolean;
  readonly exchange: string;
  readonly routingKey: string;
}

/** Publish result */
interface RabbitMqPublishResult {
  readonly ok: boolean;
  readonly duration: number;
}

/** Consume result (single message fetch) */
interface RabbitMqConsumeResult {
  readonly ok: boolean;
  readonly message: RabbitMqMessage | null;
  readonly duration: number;
}

/** Ack/Nack result */
interface RabbitMqAckResult {
  readonly ok: boolean;
  readonly duration: number;
}

/** Queue declaration result */
interface RabbitMqQueueResult {
  readonly ok: boolean;
  readonly queue: string;
  readonly messageCount: number;
  readonly consumerCount: number;
  readonly duration: number;
}

/** Exchange declaration result */
interface RabbitMqExchangeResult {
  readonly ok: boolean;
  readonly duration: number;
}
```

## RabbitMqError

```typescript
class RabbitMqError extends ClientError {
  readonly code?: number;
}

class RabbitMqConnectionError extends RabbitMqError {}
class RabbitMqChannelError extends RabbitMqError {
  readonly channelId?: number;
}
class RabbitMqNotFoundError extends RabbitMqError {
  readonly resource: string; // queue or exchange name
}
class RabbitMqPreconditionFailedError extends RabbitMqError {
  readonly reason: string;
}
```

## Expectation Helpers

```typescript
interface RabbitMqPublishResultExpectation {
  ok(): this;
  notOk(): this;
  durationLessThan(ms: number): this;
}

interface RabbitMqConsumeResultExpectation {
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  contentContains(subbody: Uint8Array): this;
  contentMatch(matcher: (content: Uint8Array) => void): this;
  propertyContains(subset: Partial<RabbitMqMessageProperties>): this;
  routingKey(expected: string): this;
  exchange(expected: string): this;
  durationLessThan(ms: number): this;
}

interface RabbitMqQueueResultExpectation {
  ok(): this;
  notOk(): this;
  messageCount(count: number): this;
  messageCountAtLeast(min: number): this;
  consumerCount(count: number): this;
  durationLessThan(ms: number): this;
}

function expectRabbitMqPublishResult(
  result: RabbitMqPublishResult,
): RabbitMqPublishResultExpectation;
function expectRabbitMqConsumeResult(
  result: RabbitMqConsumeResult,
): RabbitMqConsumeResultExpectation;
function expectRabbitMqQueueResult(
  result: RabbitMqQueueResult,
): RabbitMqQueueResultExpectation;
```

## RabbitMqClient

```typescript
/**
 * RabbitMQ connection configuration object.
 */
interface RabbitMqConnectionConfig {
  /** Host name or IP address */
  readonly host: string;

  /** Port number (default: 5672) */
  readonly port?: number;

  /** Protocol ("amqp" or "amqps") */
  readonly protocol?: "amqp" | "amqps";

  /** Username */
  readonly user?: string;

  /** Password */
  readonly password?: string;

  /** Virtual host (default: "/") */
  readonly vhost?: string;
}

interface RabbitMqClientConfig extends CommonOptions {
  /** Connection URL (string or config object) */
  readonly url: string | RabbitMqConnectionConfig;
  readonly heartbeat?: number;
  readonly prefetch?: number;
}

interface RabbitMqClient extends AsyncDisposable {
  readonly config: RabbitMqClientConfig;

  channel(): Promise<RabbitMqChannel>;

  close(): Promise<void>;
}

interface RabbitMqChannel extends AsyncDisposable {
  // Exchange
  assertExchange(
    name: string,
    type: "direct" | "topic" | "fanout" | "headers",
    options?: RabbitMqExchangeOptions,
  ): Promise<RabbitMqExchangeResult>;
  deleteExchange(
    name: string,
    options?: CommonOptions,
  ): Promise<RabbitMqExchangeResult>;

  // Queue
  assertQueue(
    name: string,
    options?: RabbitMqQueueOptions,
  ): Promise<RabbitMqQueueResult>;
  deleteQueue(
    name: string,
    options?: CommonOptions,
  ): Promise<RabbitMqQueueResult>;
  purgeQueue(
    name: string,
    options?: CommonOptions,
  ): Promise<RabbitMqQueueResult>;
  bindQueue(
    queue: string,
    exchange: string,
    routingKey: string,
    options?: CommonOptions,
  ): Promise<RabbitMqExchangeResult>;
  unbindQueue(
    queue: string,
    exchange: string,
    routingKey: string,
    options?: CommonOptions,
  ): Promise<RabbitMqExchangeResult>;

  // Publish
  publish(
    exchange: string,
    routingKey: string,
    content: Uint8Array,
    options?: RabbitMqPublishOptions,
  ): Promise<RabbitMqPublishResult>;
  sendToQueue(
    queue: string,
    content: Uint8Array,
    options?: RabbitMqPublishOptions,
  ): Promise<RabbitMqPublishResult>;

  // Consume
  get(queue: string, options?: CommonOptions): Promise<RabbitMqConsumeResult>;
  consume(
    queue: string,
    options?: RabbitMqConsumeOptions,
  ): AsyncIterable<RabbitMqMessage>;

  // Ack
  ack(
    message: RabbitMqMessage,
    options?: CommonOptions,
  ): Promise<RabbitMqAckResult>;
  nack(
    message: RabbitMqMessage,
    options?: RabbitMqNackOptions,
  ): Promise<RabbitMqAckResult>;
  reject(
    message: RabbitMqMessage,
    requeue?: boolean,
  ): Promise<RabbitMqAckResult>;

  // Prefetch
  prefetch(count: number): Promise<void>;

  close(): Promise<void>;
}

interface RabbitMqExchangeOptions extends CommonOptions {
  readonly durable?: boolean;
  readonly autoDelete?: boolean;
  readonly internal?: boolean;
  readonly arguments?: Record<string, unknown>;
}

interface RabbitMqQueueOptions extends CommonOptions {
  readonly durable?: boolean;
  readonly exclusive?: boolean;
  readonly autoDelete?: boolean;
  readonly arguments?: Record<string, unknown>;
  readonly messageTtl?: number;
  readonly maxLength?: number;
  readonly deadLetterExchange?: string;
  readonly deadLetterRoutingKey?: string;
}

interface RabbitMqPublishOptions extends CommonOptions {
  readonly persistent?: boolean;
  readonly contentType?: string;
  readonly contentEncoding?: string;
  readonly headers?: Record<string, unknown>;
  readonly correlationId?: string;
  readonly replyTo?: string;
  readonly expiration?: string;
  readonly messageId?: string;
  readonly priority?: number;
}

interface RabbitMqConsumeOptions extends CommonOptions {
  readonly noAck?: boolean;
  readonly exclusive?: boolean;
  readonly priority?: number;
}

interface RabbitMqNackOptions extends CommonOptions {
  readonly requeue?: boolean;
  readonly allUpTo?: boolean;
}

function createRabbitMqClient(
  config: RabbitMqClientConfig,
): Promise<RabbitMqClient>;
```

## Example

```typescript
import {
  createRabbitMqClient,
  expectRabbitMqConsumeResult,
  expectRabbitMqPublishResult,
} from "@probitas/client-rabbitmq";

const rabbit = await createRabbitMqClient({
  url: "amqp://guest:guest@localhost:5672",
});

const channel = await rabbit.channel();

// Declare queue
await channel.assertQueue("my-queue", { durable: true });

// Publish
const content = new TextEncoder().encode(JSON.stringify({ type: "ORDER" }));
const publishResult = await channel.sendToQueue("my-queue", content, {
  persistent: true,
  contentType: "application/json",
});
expectRabbitMqPublishResult(publishResult).ok();

// Consume (single message)
const consumeResult = await channel.get("my-queue");
expectRabbitMqConsumeResult(consumeResult).ok().hasContent();

if (consumeResult.message) {
  const body = JSON.parse(
    new TextDecoder().decode(consumeResult.message.content),
  );
  console.log(body);
  await channel.ack(consumeResult.message);
}

// Consume (streaming)
for await (const msg of channel.consume("my-queue")) {
  console.log(msg.fields.routingKey);
  await channel.ack(msg);
}

// Using connection config object
const rabbitWithConfig = await createRabbitMqClient({
  url: { host: "localhost", port: 5672, user: "guest", password: "guest" },
});

await channel.close();
await rabbit.close();
```
