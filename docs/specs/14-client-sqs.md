# @probitas/client-sqs

Amazon SQS client package.

**Depends on**: `@probitas/client`

## SqsResult Types

```typescript
/**
 * Message array with convenience helpers.
 */
interface SqsMessages extends ReadonlyArray<SqsMessage> {
  first(): SqsMessage | undefined;
  firstOrThrow(): SqsMessage;
  last(): SqsMessage | undefined;
  lastOrThrow(): SqsMessage;
}

interface SqsMessage {
  readonly messageId: string;
  readonly body: string;
  readonly receiptHandle: string;
  readonly attributes: Record<string, string>;
  readonly messageAttributes?: Record<string, SqsMessageAttribute>;
  readonly md5OfBody: string;
}

interface SqsMessageAttribute {
  readonly dataType: "String" | "Number" | "Binary";
  readonly stringValue?: string;
  readonly binaryValue?: Uint8Array;
}

/** Send result */
interface SqsSendResult {
  readonly ok: boolean;
  readonly messageId: string;
  readonly md5OfBody: string;
  readonly sequenceNumber?: string; // FIFO
  readonly duration: number;
}

/** SendBatch result */
interface SqsSendBatchResult {
  readonly ok: boolean;
  readonly successful: readonly { messageId: string; id: string }[];
  readonly failed: readonly { id: string; code: string; message: string }[];
  readonly duration: number;
}

/** Receive result */
interface SqsReceiveResult {
  readonly ok: boolean;
  readonly messages: SqsMessages;
  readonly duration: number;
}

/** Delete result */
interface SqsDeleteResult {
  readonly ok: boolean;
  readonly duration: number;
}

/** DeleteBatch result */
interface SqsDeleteBatchResult {
  readonly ok: boolean;
  readonly successful: readonly string[];
  readonly failed: readonly { id: string; code: string; message: string }[];
  readonly duration: number;
}
```

## SqsError

```typescript
class SqsError extends ClientError {
  readonly code?: string;
}

class SqsQueueNotFoundError extends SqsError {
  readonly queueUrl: string;
}

class SqsMessageTooLargeError extends SqsError {
  readonly size: number;
  readonly maxSize: number;
}

class SqsBatchError extends SqsError {
  readonly failedCount: number;
}
```

## Expectation Helpers

```typescript
interface SqsSendResultExpectation {
  ok(): this;
  notOk(): this;
  hasMessageId(): this;
  durationLessThan(ms: number): this;
}

interface SqsSendBatchResultExpectation {
  ok(): this;
  notOk(): this;
  allSuccessful(): this;
  successfulCount(count: number): this;
  failedCount(count: number): this;
  noFailures(): this;
  durationLessThan(ms: number): this;
}

interface SqsReceiveResultExpectation {
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;
  messageContains(
    subset: { body?: string; attributes?: Record<string, string> },
  ): this;
  messagesMatch(matcher: (messages: SqsMessages) => void): this;
  durationLessThan(ms: number): this;
}

interface SqsDeleteResultExpectation {
  ok(): this;
  notOk(): this;
  durationLessThan(ms: number): this;
}

function expectSqsSendResult(result: SqsSendResult): SqsSendResultExpectation;
function expectSqsSendBatchResult(
  result: SqsSendBatchResult,
): SqsSendBatchResultExpectation;
function expectSqsReceiveResult(
  result: SqsReceiveResult,
): SqsReceiveResultExpectation;
function expectSqsDeleteResult(
  result: SqsDeleteResult,
): SqsDeleteResultExpectation;
function expectSqsDeleteBatchResult(
  result: SqsDeleteBatchResult,
): SqsSendBatchResultExpectation;
```

## SqsClient

```typescript
interface SqsClientConfig extends CommonOptions {
  readonly region: string;
  readonly credentials?: { accessKeyId: string; secretAccessKey: string };
  readonly queueUrl: string;
  readonly endpoint?: string; // LocalStack
}

interface SqsClient extends AsyncDisposable {
  readonly config: SqsClientConfig;

  send(body: string, options?: SqsSendOptions): Promise<SqsSendResult>;
  sendBatch(messages: SqsBatchMessage[]): Promise<SqsSendBatchResult>;
  receive(options?: SqsReceiveOptions): Promise<SqsReceiveResult>;
  delete(
    receiptHandle: string,
    options?: CommonOptions,
  ): Promise<SqsDeleteResult>;
  deleteBatch(
    receiptHandles: string[],
    options?: CommonOptions,
  ): Promise<SqsDeleteBatchResult>;
  purge(options?: CommonOptions): Promise<SqsDeleteResult>;

  close(): Promise<void>;
}

interface SqsSendOptions extends CommonOptions {
  readonly delaySeconds?: number;
  readonly messageAttributes?: Record<string, SqsMessageAttribute>;
  readonly messageGroupId?: string; // FIFO
  readonly messageDeduplicationId?: string; // FIFO
}

interface SqsBatchMessage {
  readonly id: string;
  readonly body: string;
  readonly delaySeconds?: number;
  readonly messageAttributes?: Record<string, SqsMessageAttribute>;
}

interface SqsReceiveOptions extends CommonOptions {
  readonly maxMessages?: number; // 1-10
  readonly waitTimeSeconds?: number; // Long polling
  readonly visibilityTimeout?: number;
  readonly attributeNames?: readonly string[];
  readonly messageAttributeNames?: readonly string[];
}

function createSqsClient(config: SqsClientConfig): Promise<SqsClient>;
```

## Example

```typescript
import {
  createSqsClient,
  expectSqsReceiveResult,
  expectSqsSendResult,
} from "@probitas/client-sqs";

const sqs = await createSqsClient({
  region: "ap-northeast-1",
  queueUrl: "https://sqs.ap-northeast-1.amazonaws.com/123456789/my-queue",
  endpoint: "http://localhost:4566", // LocalStack
});

// Send
const sendResult = await sqs.send(
  JSON.stringify({ type: "ORDER", orderId: "123" }),
);
expectSqsSendResult(sendResult).ok().hasMessageId();

// Receive (Long polling)
const receiveResult = await sqs.receive({
  maxMessages: 10,
  waitTimeSeconds: 20,
});
expectSqsReceiveResult(receiveResult).ok().hasContent();

// Process and delete
for (const msg of receiveResult.messages) {
  console.log(JSON.parse(msg.body));
  await sqs.delete(msg.receiptHandle);
}

await sqs.close();
```
