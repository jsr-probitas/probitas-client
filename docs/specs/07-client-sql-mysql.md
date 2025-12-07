# @probitas/client-sql-mysql

MySQL client package.

**Depends on**: `@probitas/client`, `@probitas/client-sql`

## MySqlClient

```typescript
/**
 * MySQL connection configuration object.
 */
interface MySqlConnectionConfig {
  /** Host name or IP address */
  readonly host: string;

  /** Port number (default: 3306) */
  readonly port?: number;

  /** Database name */
  readonly database?: string;

  /** Username */
  readonly user?: string;

  /** Password */
  readonly password?: string;
}

interface MySqlClientConfig extends CommonOptions {
  /** Connection URL (string or config object) */
  readonly url: string | MySqlConnectionConfig;
  readonly pool?: PoolConfig;
  readonly charset?: string;
  readonly timezone?: string;
}

interface MySqlClient extends AsyncDisposable {
  readonly config: MySqlClientConfig;
  readonly dialect: "mysql";

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

  close(): Promise<void>;
}

function createMySqlClient(config: MySqlClientConfig): Promise<MySqlClient>;
```

## Example

```typescript
import { createMySqlClient } from "@probitas/client-sql-mysql";
import { expectSqlQueryResult } from "@probitas/client-sql";

const db = await createMySqlClient({
  url: "mysql://user:pass@localhost:3306/mydb",
  charset: "utf8mb4",
});

const result = await db.query<{ id: number; name: string }>(
  "SELECT * FROM users WHERE active = ?",
  [true],
);

expectSqlQueryResult(result).ok().hasContent();

// Using connection config object
const dbWithConfig = await createMySqlClient({
  url: {
    host: "localhost",
    port: 3306,
    database: "mydb",
    user: "user",
    password: "pass",
  },
  charset: "utf8mb4",
});

await db.close();
```
