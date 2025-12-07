# @probitas/client-sql-postgres

PostgreSQL client package.

**Depends on**: `@probitas/client`, `@probitas/client-sql`

## PostgresClient

```typescript
/**
 * PostgreSQL connection configuration object.
 */
interface PostgresConnectionConfig {
  /** Host name or IP address */
  readonly host: string;

  /** Port number (default: 5432) */
  readonly port?: number;

  /** Database name */
  readonly database?: string;

  /** Username */
  readonly user?: string;

  /** Password */
  readonly password?: string;
}

interface PostgresClientConfig extends CommonOptions {
  /** Connection URL (string or config object) */
  readonly url: string | PostgresConnectionConfig;
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
  url: "postgresql://user:pass@localhost:5432/mydb",
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

// Using connection config object
const dbWithConfig = await createPostgresClient({
  url: {
    host: "localhost",
    port: 5432,
    database: "mydb",
    user: "user",
    password: "pass",
  },
});

await db.close();
```
