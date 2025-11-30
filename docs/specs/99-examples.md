# Examples & Implementation Roadmap

## Probitas Scenario Examples

### HTTP + PostgreSQL E2E Test

```typescript
import { scenario } from "probitas";
import { createHttpClient, expectHttpResponse } from "@probitas/client-http";
import { createPostgresClient } from "@probitas/client-sql-postgres";
import { expectSqlQueryResult } from "@probitas/client-sql";

export default scenario("User Registration E2E", { tags: ["e2e"] })
  .resource("http", () =>
    createHttpClient({
      baseUrl: "http://localhost:3000",
    }))
  .resource("db", () =>
    createPostgresClient({
      connection: "postgresql://test:test@localhost:5432/testdb",
    }))
  .setup(async (ctx) => {
    await ctx.resources.db.query(
      "DELETE FROM users WHERE email LIKE '%@test.com'",
    );
  })
  .step("Register user", async (ctx) => {
    const res = await ctx.resources.http.post("/api/users", {
      email: "john@test.com",
      password: "secret",
    });

    expectHttpResponse(res).ok().status(201);
    return res.json<{ id: string }>();
  })
  .step("Verify in database", async (ctx) => {
    const { id } = ctx.previous;

    const result = await ctx.resources.db.query<User>(
      "SELECT * FROM users WHERE id = $1",
      [id],
    );

    expectSqlQueryResult(result).rows(1);
    return result.rows.firstOrThrow();
  })
  .build();
```

### GraphQL + MongoDB Test

```typescript
import { scenario } from "probitas";
import {
  createGraphqlClient,
  expectGraphqlResponse,
  outdent,
} from "@probitas/client-graphql";
import {
  createMongoClient,
  expectMongoFindResult,
} from "@probitas/client-mongodb";

export default scenario("Create Order", { tags: ["graphql", "mongodb"] })
  .resource("gql", () =>
    createGraphqlClient({
      endpoint: "http://localhost:4000/graphql",
    }))
  .resource("mongo", () =>
    createMongoClient({
      uri: "mongodb://localhost:27017",
      database: "orders",
    }))
  .step("Create order via GraphQL", async (ctx) => {
    const mutation = outdent`
      mutation CreateOrder($input: CreateOrderInput!) {
        createOrder(input: $input) {
          id
          status
          items { productId quantity }
        }
      }
    `;

    const res = await ctx.resources.gql.mutate(mutation, {
      input: {
        items: [{ productId: "PROD-1", quantity: 2 }],
      },
    });

    expectGraphqlResponse(res).ok().noErrors();
    return res.data<{ createOrder: { id: string } }>()!.createOrder;
  })
  .step("Verify in MongoDB", async (ctx) => {
    const { id } = ctx.previous;
    const orders = ctx.resources.mongo.collection("orders");

    const result = await orders.find({ _id: id });
    expectMongoFindResult(result).ok().docs(1);

    return result.docs.firstOrThrow();
  })
  .build();
```

### Redis + SQS Messaging Test

```typescript
import { scenario } from "probitas";
import { createRedisClient, expectRedisResult } from "@probitas/client-redis";
import { createSqsClient, expectSqsReceiveResult } from "@probitas/client-sqs";

export default scenario("Event Processing", { tags: ["messaging"] })
  .resource("redis", () => createRedisClient({ host: "localhost" }))
  .resource("sqs", () =>
    createSqsClient({
      region: "ap-northeast-1",
      queueUrl: "http://localhost:4566/queue/events",
      endpoint: "http://localhost:4566",
    }))
  .step("Publish event", async (ctx) => {
    // Store state in cache
    await ctx.resources.redis.set("event:status", "pending");

    // Send event to SQS
    const result = await ctx.resources.sqs.send(
      JSON.stringify({
        type: "ORDER_CREATED",
        orderId: "123",
      }),
    );

    return result.messageId;
  })
  .step("Verify event received", async (ctx) => {
    const result = await ctx.resources.sqs.receive({
      maxMessages: 1,
      waitTimeSeconds: 5,
    });

    expectSqsReceiveResult(result).ok().hasContent();

    const msg = result.messages.firstOrThrow();
    const body = JSON.parse(msg.body);

    if (body.type !== "ORDER_CREATED") {
      throw new Error(`Unexpected event type: ${body.type}`);
    }

    await ctx.resources.sqs.delete(msg.receiptHandle);

    // Update Redis state
    await ctx.resources.redis.set("event:status", "processed");
  })
  .step("Check final state", async (ctx) => {
    const result = await ctx.resources.redis.get("event:status");
    expectRedisResult(result).ok().value("processed");
  })
  .build();
```

---

## Implementation Roadmap

### Phase 1 (MVP)

| Package                         | Content                                                        |
| ------------------------------- | -------------------------------------------------------------- |
| `@probitas/client`              | Core (CommonOptions, ClientError)                              |
| `@probitas/client-http`         | HttpResponse, HttpError, expectHttpResponse, HttpClient        |
| `@probitas/client-sql`          | SqlQueryResult, SqlTransaction, SqlError, expectSqlQueryResult |
| `@probitas/client-sql-postgres` | PostgresClient                                                 |
| `@probitas/client-sql-sqlite`   | SqliteClient                                                   |

### Phase 2

| Package                       | Content      |
| ----------------------------- | ------------ |
| `@probitas/client-sql-mysql`  | MySqlClient  |
| `@probitas/client-sql-duckdb` | DuckDbClient |
| `@probitas/client-mongodb`    | MongoClient  |
| `@probitas/client-redis`      | RedisClient  |

### Phase 3

| Package                    | Content                                                             |
| -------------------------- | ------------------------------------------------------------------- |
| `@probitas/client-grpc`    | GrpcResponse, GrpcError, expectGrpcResponse, GrpcClient             |
| `@probitas/client-graphql` | GraphqlResponse, GraphqlError, expectGraphqlResponse, GraphqlClient |

### Phase 4

| Package                     | Content        |
| --------------------------- | -------------- |
| `@probitas/client-dynamodb` | DynamoClient   |
| `@probitas/client-deno-kv`  | DenoKvClient   |
| `@probitas/client-sqs`      | SqsClient      |
| `@probitas/client-rabbitmq` | RabbitMqClient |

---

## Package Index

| #  | Package                         | Spec                                                     |
| -- | ------------------------------- | -------------------------------------------------------- |
| 1  | `@probitas/client`              | [01-client.md](./01-client.md)                           |
| 2  | `@probitas/client-http`         | [02-client-http.md](./02-client-http.md)                 |
| 3  | `@probitas/client-grpc`         | [03-client-grpc.md](./03-client-grpc.md)                 |
| 4  | `@probitas/client-graphql`      | [04-client-graphql.md](./04-client-graphql.md)           |
| 5  | `@probitas/client-sql`          | [05-client-sql.md](./05-client-sql.md)                   |
| 6  | `@probitas/client-sql-postgres` | [06-client-sql-postgres.md](./06-client-sql-postgres.md) |
| 7  | `@probitas/client-sql-mysql`    | [07-client-sql-mysql.md](./07-client-sql-mysql.md)       |
| 8  | `@probitas/client-sql-sqlite`   | [08-client-sql-sqlite.md](./08-client-sql-sqlite.md)     |
| 9  | `@probitas/client-sql-duckdb`   | [09-client-sql-duckdb.md](./09-client-sql-duckdb.md)     |
| 10 | `@probitas/client-mongodb`      | [10-client-mongodb.md](./10-client-mongodb.md)           |
| 11 | `@probitas/client-redis`        | [11-client-redis.md](./11-client-redis.md)               |
| 12 | `@probitas/client-dynamodb`     | [12-client-dynamodb.md](./12-client-dynamodb.md)         |
| 13 | `@probitas/client-deno-kv`      | [13-client-deno-kv.md](./13-client-deno-kv.md)           |
| 14 | `@probitas/client-sqs`          | [14-client-sqs.md](./14-client-sqs.md)                   |
| 15 | `@probitas/client-rabbitmq`     | [15-client-rabbitmq.md](./15-client-rabbitmq.md)         |
