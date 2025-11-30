# @probitas/client-sql

Shared SQL types and expectations used by all SQL client packages.

## SqlQueryResult

```typescript
/**
 * Row array with convenience helpers.
 */
interface SqlRows<T> extends ReadonlyArray<T> {
  /** Get first row (or undefined) */
  first(): T | undefined;

  /** Get first row (or throw when empty) */
  firstOrThrow(): T;

  /** Get last row (or undefined) */
  last(): T | undefined;

  /** Get last row (or throw when empty) */
  lastOrThrow(): T;
}

/**
 * SQL query result shared by all SQL clients.
 */
interface SqlQueryResult<T = Record<string, any>> {
  /** Whether the query succeeded */
  readonly ok: boolean;

  /** Fetched rows */
  readonly rows: SqlRows<T>;

  /** Affected row count (INSERT, UPDATE, DELETE) */
  readonly rowCount: number;

  /** Query duration in milliseconds */
  readonly duration: number;

  /** Extra metadata */
  readonly metadata: SqlQueryResultMetadata;

  /** Map rows to another type (useful for renames or nesting) */
  map<U>(mapper: (row: T) => U): U[];

  /** Map rows to class instances */
  as<U>(ctor: new (row: T) => U): U[];
}

interface SqlQueryResultMetadata {
  /** Last inserted ID */
  readonly lastInsertId?: bigint | string;

  /** Warning messages */
  readonly warnings?: readonly string[];
}
```

## SqlTransaction

```typescript
interface SqlTransaction {
  query<T = Record<string, any>>(
    sql: string,
    params?: unknown[],
  ): Promise<SqlQueryResult<T>>;
  queryOne<T = Record<string, any>>(
    sql: string,
    params?: unknown[],
  ): Promise<T | undefined>;
  commit(): Promise<void>;
  rollback(): Promise<void>;
}

interface SqlTransactionOptions {
  readonly isolationLevel?:
    | "read_uncommitted"
    | "read_committed"
    | "repeatable_read"
    | "serializable";
}
```

## SqlError

```typescript
/**
 * SQL error (extends ClientError), shared across SQL clients.
 */
class SqlError extends ClientError {
  /** SQL State (e.g., "23505" for unique violation) */
  readonly sqlState?: string;
}

class QuerySyntaxError extends SqlError {
  readonly kind = "query";
}
class ConstraintError extends SqlError {
  readonly kind = "constraint";
  readonly constraint: string;
}
class DeadlockError extends SqlError {
  readonly kind = "deadlock";
}
```

## expectSqlQueryResult

```typescript
interface SqlQueryResultExpectation<T> {
  // --- Status ---
  ok(): this;
  notOk(): this;

  // --- Row count ---
  noContent(): this;
  hasContent(): this;
  rows(count: number): this;
  rowsAtLeast(count: number): this;
  rowsAtMost(count: number): this;

  // --- Affected rows ---
  rowCount(count: number): this;
  rowCountAtLeast(count: number): this;
  rowCountAtMost(count: number): this;

  // --- Row data ---
  rowContains(subset: Partial<T>): this;
  rowMatch(matcher: (rows: SqlRows<T>) => void): this;

  // --- Transformed data ---
  mapContains<U>(mapper: (row: T) => U, subset: Partial<U>): this;
  mapMatch<U>(mapper: (row: T) => U, matcher: (mapped: U[]) => void): this;
  asContains<U>(ctor: new (row: T) => U, subset: Partial<U>): this;
  asMatch<U>(ctor: new (row: T) => U, matcher: (instances: U[]) => void): this;

  // --- Metadata ---
  lastInsertId(expected: bigint | string): this;
  hasLastInsertId(): this;

  // --- Performance ---
  durationLessThan(ms: number): this;
}

function expectSqlQueryResult<T = Record<string, any>>(
  result: SqlQueryResult<T>,
): SqlQueryResultExpectation<T>;
```
