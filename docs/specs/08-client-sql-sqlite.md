# @probitas/client-sql-sqlite

SQLite client package.

**Depends on**: `@probitas/client`, `@probitas/client-sql`

## SqliteClient

```typescript
interface SqliteClientConfig extends CommonOptions {
  readonly path: string; // or ":memory:"
  readonly readonly?: boolean;
  readonly wal?: boolean;
}

interface SqliteClient extends AsyncDisposable {
  readonly config: SqliteClientConfig;
  readonly dialect: "sqlite";

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

  // SQLite specific
  backup(destPath: string): Promise<void>;
  vacuum(): Promise<void>;

  close(): Promise<void>;
}

function createSqliteClient(config: SqliteClientConfig): Promise<SqliteClient>;
```

## Example

```typescript
import { createSqliteClient } from "@probitas/client-sql-sqlite";
import { expectSqlQueryResult } from "@probitas/client-sql";

// In-memory database
const db = await createSqliteClient({
  path: ":memory:",
  wal: true,
});

await db.query("CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT)");
await db.query("INSERT INTO users (name) VALUES (?)", ["Alice"]);

const result = await db.query<{ id: number; name: string }>(
  "SELECT * FROM users",
);
expectSqlQueryResult(result).ok().count(1);

// Backup
await db.backup("./backup.db");

await db.close();
```
