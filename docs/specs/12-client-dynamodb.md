# @probitas/client-dynamodb

DynamoDB client package.

**Depends on**: `@probitas/client`

## DynamoResult Types

```typescript
/**
 * Item array with convenience helpers.
 */
interface DynamoItems<T> extends ReadonlyArray<T> {
  first(): T | undefined;
  firstOrThrow(): T;
  last(): T | undefined;
  lastOrThrow(): T;
}

/** Get result */
interface DynamoGetResult<T> {
  readonly ok: boolean;
  readonly item: T | null;
  readonly consumedCapacity?: number;
  readonly duration: number;
}

/** Put result */
interface DynamoPutResult {
  readonly ok: boolean;
  readonly consumedCapacity?: number;
  readonly duration: number;
}

/** Update result */
interface DynamoUpdateResult<T> {
  readonly ok: boolean;
  readonly attributes?: T;
  readonly consumedCapacity?: number;
  readonly duration: number;
}

/** Delete result */
interface DynamoDeleteResult<T> {
  readonly ok: boolean;
  readonly attributes?: T; // ReturnValues: ALL_OLD
  readonly consumedCapacity?: number;
  readonly duration: number;
}

/** Query/Scan result */
interface DynamoQueryResult<T> {
  readonly ok: boolean;
  readonly items: DynamoItems<T>;
  readonly count: number;
  readonly scannedCount: number;
  readonly lastEvaluatedKey?: Record<string, unknown>;
  readonly consumedCapacity?: number;
  readonly duration: number;
}

/** BatchWrite result */
interface DynamoBatchWriteResult {
  readonly ok: boolean;
  readonly unprocessedItems: number;
  readonly consumedCapacity?: number;
  readonly duration: number;
}
```

## DynamoError

```typescript
class DynamoError extends ClientError {
  readonly code?: string;
}

class DynamoConditionCheckError extends DynamoError {}
class DynamoProvisionedThroughputError extends DynamoError {}
class DynamoResourceNotFoundError extends DynamoError {
  readonly tableName: string;
}
class DynamoValidationError extends DynamoError {}
class DynamoTransactionCancelledError extends DynamoError {
  readonly cancellationReasons: readonly { code: string; message: string }[];
}
```

## Expectation Helpers

```typescript
interface DynamoGetResultExpectation<T> {
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  itemContains(subset: Partial<T>): this;
  itemMatch(matcher: (item: T) => void): this;
  durationLessThan(ms: number): this;
}

interface DynamoQueryResultExpectation<T> {
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;
  itemContains(subset: Partial<T>): this;
  itemsMatch(matcher: (items: DynamoItems<T>) => void): this;
  hasMorePages(): this;
  noMorePages(): this;
  durationLessThan(ms: number): this;
}

interface DynamoWriteResultExpectation {
  ok(): this;
  notOk(): this;
  durationLessThan(ms: number): this;
}

function expectDynamoGetResult<T>(
  result: DynamoGetResult<T>,
): DynamoGetResultExpectation<T>;
function expectDynamoQueryResult<T>(
  result: DynamoQueryResult<T>,
): DynamoQueryResultExpectation<T>;
function expectDynamoPutResult(
  result: DynamoPutResult,
): DynamoWriteResultExpectation;
function expectDynamoUpdateResult<T>(
  result: DynamoUpdateResult<T>,
): DynamoWriteResultExpectation;
function expectDynamoDeleteResult<T>(
  result: DynamoDeleteResult<T>,
): DynamoWriteResultExpectation;
```

## DynamoClient

```typescript
interface DynamoClientConfig extends CommonOptions {
  readonly region: string;
  readonly credentials?: { accessKeyId: string; secretAccessKey: string };
  readonly endpoint?: string; // LocalStack
}

interface DynamoClient extends AsyncDisposable {
  readonly config: DynamoClientConfig;

  table<T extends Record<string, unknown> = Record<string, unknown>>(
    name: string,
  ): DynamoTable<T>;
  transaction<R>(fn: (tx: DynamoTransaction) => Promise<R>): Promise<R>;

  close(): Promise<void>;
}

interface DynamoTable<T> {
  get(
    key: Record<string, unknown>,
    options?: DynamoGetOptions,
  ): Promise<DynamoGetResult<T>>;
  put(item: T, options?: DynamoPutOptions): Promise<DynamoPutResult>;
  update(
    key: Record<string, unknown>,
    updates: DynamoUpdateExpression,
    options?: DynamoUpdateOptions,
  ): Promise<DynamoUpdateResult<T>>;
  delete(
    key: Record<string, unknown>,
    options?: DynamoDeleteOptions,
  ): Promise<DynamoDeleteResult<T>>;
  query(
    params: DynamoQueryParams,
    options?: CommonOptions,
  ): Promise<DynamoQueryResult<T>>;
  scan(options?: DynamoScanOptions): Promise<DynamoQueryResult<T>>;
  batchWrite(
    items: { put?: T[]; delete?: Record<string, unknown>[] },
  ): Promise<DynamoBatchWriteResult>;
}

interface DynamoGetOptions extends CommonOptions {
  readonly consistentRead?: boolean;
  readonly projectionExpression?: string;
}

interface DynamoPutOptions extends CommonOptions {
  readonly conditionExpression?: string;
  readonly expressionAttributeValues?: Record<string, unknown>;
}

interface DynamoUpdateOptions extends CommonOptions {
  readonly conditionExpression?: string;
  readonly returnValues?:
    | "NONE"
    | "ALL_OLD"
    | "UPDATED_OLD"
    | "ALL_NEW"
    | "UPDATED_NEW";
}

interface DynamoDeleteOptions extends CommonOptions {
  readonly conditionExpression?: string;
  readonly returnValues?: "NONE" | "ALL_OLD";
}

interface DynamoQueryParams {
  readonly keyConditionExpression: string;
  readonly filterExpression?: string;
  readonly expressionAttributeValues: Record<string, unknown>;
  readonly expressionAttributeNames?: Record<string, string>;
  readonly limit?: number;
  readonly scanIndexForward?: boolean;
  readonly exclusiveStartKey?: Record<string, unknown>;
  readonly indexName?: string;
}

interface DynamoScanOptions extends CommonOptions {
  readonly filterExpression?: string;
  readonly expressionAttributeValues?: Record<string, unknown>;
  readonly limit?: number;
  readonly exclusiveStartKey?: Record<string, unknown>;
}

interface DynamoUpdateExpression {
  readonly set?: Record<string, unknown>;
  readonly remove?: string[];
  readonly add?: Record<string, number>;
  readonly delete?: Record<string, Set<string | number>>;
}

interface DynamoTransaction {
  table<T extends Record<string, unknown>>(
    name: string,
  ): DynamoTransactionTable<T>;
}

interface DynamoTransactionTable<T> {
  put(item: T, options?: DynamoPutOptions): void;
  update(
    key: Record<string, unknown>,
    updates: DynamoUpdateExpression,
    options?: DynamoUpdateOptions,
  ): void;
  delete(key: Record<string, unknown>, options?: DynamoDeleteOptions): void;
  conditionCheck(
    key: Record<string, unknown>,
    conditionExpression: string,
  ): void;
}

function createDynamoClient(config: DynamoClientConfig): Promise<DynamoClient>;
```

## Example

```typescript
import {
  createDynamoClient,
  expectDynamoGetResult,
  expectDynamoQueryResult,
} from "@probitas/client-dynamodb";

const dynamo = await createDynamoClient({
  region: "ap-northeast-1",
  endpoint: "http://localhost:4566", // LocalStack
});

const users = dynamo.table<{ pk: string; sk: string; name: string }>("users");

// Put
await users.put({ pk: "USER#1", sk: "PROFILE", name: "Alice" });

// Get
const getResult = await users.get({ pk: "USER#1", sk: "PROFILE" });
expectDynamoGetResult(getResult).ok().hasContent().itemContains({
  name: "Alice",
});

// Query
const queryResult = await users.query({
  keyConditionExpression: "pk = :pk",
  expressionAttributeValues: { ":pk": "USER#1" },
});
expectDynamoQueryResult(queryResult).ok().countAtLeast(1);

await dynamo.close();
```
