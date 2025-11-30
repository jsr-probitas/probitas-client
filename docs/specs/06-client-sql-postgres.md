# @probitas/client-sql-postgres

PostgreSQL client package.

**Depends on**: `@probitas/client`, `@probitas/client-sql`

## PostgresClient

```typescript
interface PostgresClientConfig extends CommonOptions {
  readonly connection: string | ConnectionConfig;
  readonly pool?: PoolConfig;
  readonly applicationName?: string;
}

interface PostgresClient extends AsyncDisposable {
  readonly config: PostgresClientConfig;
  readonly dialect: "postgres";

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

  // PostgreSQL-specific
  copyFrom(table: string, data: AsyncIterable<unknown[]>): Promise<number>;
  copyTo(query: string): AsyncIterable<unknown[]>;
  listen(channel: string): AsyncIterable<Notification>;
  notify(channel: string, payload?: string): Promise<void>;

  close(): Promise<void>;
}

function createPostgresClient(
  config: PostgresClientConfig,
): Promise<PostgresClient>;
```

## Example

```typescript
import { createPostgresClient } from "@probitas/client-sql-postgres";
import { expectSqlQueryResult } from "@probitas/client-sql";

const db = await createPostgresClient({
  connection: "postgresql://user:pass@localhost:5432/mydb",
});

// Run a query
const result = await db.query<{ id: number; name: string }>(
  "SELECT * FROM users WHERE active = $1",
  [true],
);

expectSqlQueryResult(result).ok().rowsAtLeast(1);
const firstUser = result.rows.firstOrThrow();

// Transaction
await db.transaction(async (tx) => {
  await tx.query("INSERT INTO logs (message) VALUES ($1)", ["start"]);
  await tx.query("UPDATE users SET updated_at = NOW() WHERE id = $1", [1]);
});

// PostgreSQL features
for await (const notification of db.listen("my_channel")) {
  console.log(notification.payload);
}

await db.close();
```
