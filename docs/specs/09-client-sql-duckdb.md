# @probitas/client-sql-duckdb

DuckDB client package.

**Depends on**: `@probitas/client`, `@probitas/client-sql`

## DuckDbClient

```typescript
interface DuckDbClientConfig extends CommonOptions {
  readonly path?: string; // undefined = in-memory
  readonly readonly?: boolean;
}

interface DuckDbClient extends AsyncDisposable {
  readonly config: DuckDbClientConfig;
  readonly dialect: "duckdb";

  query<T = Record<string, any>>(
    sql: string,
    params?: unknown[],
  ): Promise<SqlQueryResult<T>>;
  queryOne<T = Record<string, any>>(
    sql: string,
    params?: unknown[],
  ): Promise<T | undefined>;
  transaction<T>(
    fn: (tx: SqlTransaction) => Promise<T>,
    options?: SqlTransactionOptions,
  ): Promise<T>;

  // DuckDB specific
  queryParquet<T = Record<string, any>>(
    path: string,
  ): Promise<SqlQueryResult<T>>;
  queryCsv<T = Record<string, any>>(path: string): Promise<SqlQueryResult<T>>;

  close(): Promise<void>;
}

function createDuckDbClient(config: DuckDbClientConfig): Promise<DuckDbClient>;
```

## Example

```typescript
import { createDuckDbClient } from "@probitas/client-sql-duckdb";
import { expectSqlQueryResult } from "@probitas/client-sql";

// In-memory database
const db = await createDuckDbClient({});

// Regular query
const result = await db.query("SELECT 1 + 1 AS answer");
expectSqlQueryResult(result).ok();

// Query Parquet directly
const parquetResult = await db.queryParquet<{ id: number; value: string }>(
  "./data/events.parquet",
);
expectSqlQueryResult(parquetResult).ok().rowsAtLeast(100);

// Query CSV directly
const csvResult = await db.queryCsv<{ name: string; age: number }>(
  "./data/users.csv",
);

await db.close();
```
