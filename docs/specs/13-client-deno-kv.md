# @probitas/client-deno-kv

Deno KV client package.

**Depends on**: `@probitas/client`

## DenoKvResult Types

```typescript
/** Get result */
interface DenoKvGetResult<T> {
  readonly ok: boolean;
  readonly key: Deno.KvKey;
  readonly value: T | null;
  readonly versionstamp: string | null;
  readonly duration: number;
}

/** Set result */
interface DenoKvSetResult {
  readonly ok: boolean;
  readonly versionstamp: string;
  readonly duration: number;
}

/** Delete result */
interface DenoKvDeleteResult {
  readonly ok: boolean;
  readonly duration: number;
}

/** List result */
interface DenoKvListResult<T> {
  readonly ok: boolean;
  readonly entries: DenoKvEntries<T>;
  readonly duration: number;
}

interface DenoKvEntries<T> extends ReadonlyArray<DenoKvEntry<T>> {
  first(): DenoKvEntry<T> | undefined;
  firstOrThrow(): DenoKvEntry<T>;
  last(): DenoKvEntry<T> | undefined;
  lastOrThrow(): DenoKvEntry<T>;
}

interface DenoKvEntry<T> {
  readonly key: Deno.KvKey;
  readonly value: T;
  readonly versionstamp: string;
}

/** Atomic commit result */
interface DenoKvAtomicResult {
  readonly ok: boolean;
  readonly versionstamp?: string;
  readonly duration: number;
}
```

## DenoKvError

```typescript
class DenoKvError extends ClientError {}

class DenoKvAtomicCheckError extends DenoKvError {
  readonly failedChecks: readonly Deno.KvKey[];
}

class DenoKvQuotaError extends DenoKvError {}
```

## Expectation Helpers

```typescript
interface DenoKvGetResultExpectation<T> {
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  value(expected: T): this;
  valueContains(subset: Partial<T>): this;
  valueMatch(matcher: (value: T) => void): this;
  hasVersionstamp(): this;
  durationLessThan(ms: number): this;
}

interface DenoKvListResultExpectation<T> {
  ok(): this;
  notOk(): this;
  noContent(): this;
  hasContent(): this;
  count(expected: number): this;
  countAtLeast(min: number): this;
  countAtMost(max: number): this;
  entryContains(subset: { key?: Deno.KvKey; value?: Partial<T> }): this;
  entriesMatch(matcher: (entries: DenoKvEntries<T>) => void): this;
  durationLessThan(ms: number): this;
}

interface DenoKvWriteResultExpectation {
  ok(): this;
  notOk(): this;
  hasVersionstamp(): this;
  durationLessThan(ms: number): this;
}

function expectDenoKvGetResult<T>(
  result: DenoKvGetResult<T>,
): DenoKvGetResultExpectation<T>;
function expectDenoKvListResult<T>(
  result: DenoKvListResult<T>,
): DenoKvListResultExpectation<T>;
function expectDenoKvSetResult(
  result: DenoKvSetResult,
): DenoKvWriteResultExpectation;
function expectDenoKvDeleteResult(
  result: DenoKvDeleteResult,
): DenoKvWriteResultExpectation;
function expectDenoKvAtomicResult(
  result: DenoKvAtomicResult,
): DenoKvWriteResultExpectation;
```

## DenoKvClient

```typescript
interface DenoKvClientConfig extends CommonOptions {
  readonly path?: string;
}

interface DenoKvClient extends AsyncDisposable {
  readonly config: DenoKvClientConfig;

  get<T>(key: Deno.KvKey, options?: CommonOptions): Promise<DenoKvGetResult<T>>;
  getMany<T extends readonly unknown[]>(
    keys: readonly [...{ [K in keyof T]: Deno.KvKey }],
    options?: CommonOptions,
  ): Promise<{ [K in keyof T]: DenoKvGetResult<T[K]> }>;
  set<T>(
    key: Deno.KvKey,
    value: T,
    options?: DenoKvSetOptions,
  ): Promise<DenoKvSetResult>;
  delete(key: Deno.KvKey, options?: CommonOptions): Promise<DenoKvDeleteResult>;
  list<T>(
    selector: Deno.KvListSelector,
    options?: DenoKvListOptions,
  ): Promise<DenoKvListResult<T>>;
  atomic(): DenoKvAtomicBuilder;

  close(): Promise<void>;
}

interface DenoKvSetOptions extends CommonOptions {
  readonly expireIn?: number; // milliseconds
}

interface DenoKvListOptions extends CommonOptions {
  readonly limit?: number;
  readonly cursor?: string;
  readonly reverse?: boolean;
}

interface DenoKvAtomicBuilder {
  check(...checks: Deno.AtomicCheck[]): this;
  set<T>(key: Deno.KvKey, value: T, options?: { expireIn?: number }): this;
  delete(key: Deno.KvKey): this;
  sum(key: Deno.KvKey, n: bigint): this;
  min(key: Deno.KvKey, n: bigint): this;
  max(key: Deno.KvKey, n: bigint): this;
  commit(): Promise<DenoKvAtomicResult>;
}

function createDenoKvClient(config?: DenoKvClientConfig): Promise<DenoKvClient>;
```

## Example

```typescript
import {
  createDenoKvClient,
  expectDenoKvGetResult,
  expectDenoKvListResult,
} from "@probitas/client-deno-kv";

const kv = await createDenoKvClient();

// Set
await kv.set(["users", "1"], { name: "Alice", age: 30 });

// Get
const getResult = await kv.get<{ name: string; age: number }>(["users", "1"]);
expectDenoKvGetResult(getResult).ok().hasContent().valueContains({
  name: "Alice",
});

// List
const listResult = await kv.list<{ name: string }>({ prefix: ["users"] });
expectDenoKvListResult(listResult).ok().countAtLeast(1);

// Atomic
const atomic = kv.atomic();
atomic.check({ key: ["counter"], versionstamp: null });
atomic.set(["counter"], 1n);
const atomicResult = await atomic.commit();

await kv.close();
```
