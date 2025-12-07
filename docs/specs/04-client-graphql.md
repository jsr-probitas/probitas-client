# @probitas/client-graphql

GraphQL client package.

## GraphqlResponse

```typescript
/**
 * GraphQL response
 */
interface GraphqlResponse {
  /** Whether no GraphQL errors exist */
  readonly ok: boolean;

  /** HTTP status code */
  readonly status: number;

  /** Response headers */
  readonly headers: Headers;

  /** GraphQL errors (if any) */
  readonly errors: readonly GraphqlError[] | null;

  /** Response time in milliseconds */
  readonly duration: number;

  /** Original HTTP Response */
  readonly raw: globalThis.Response;

  /**
   * Get `data` (or null).
   * Does not throw even when errors exist.
   */
  data<T = any>(): T | null;
}

interface GraphqlError {
  readonly message: string;
  readonly locations?: readonly { line: number; column: number }[];
  readonly path?: readonly (string | number)[];
  readonly extensions?: Record<string, unknown>;
}
```

## GraphqlClientError

```typescript
class GraphqlClientError extends ClientError {
  readonly errors: readonly GraphqlError[];
  readonly response?: GraphqlResponse;
}
```

## expectGraphqlResponse

```typescript
interface GraphqlResponseExpectation {
  // --- Error checks ---
  ok(): this;
  notOk(): this;
  errorCount(n: number): this;
  errorContains(message: string): this;
  error(messageMatcher: string | RegExp): this;
  errorMatch(matcher: (errors: readonly GraphqlError[]) => void): this;

  // --- Data checks ---
  hasContent(): this;
  noContent(): this;
  dataContains<T = any>(subset: Partial<T>): this;
  dataMatch<T = any>(matcher: (data: T) => void): this;

  // --- Extensions ---
  extensionExists(key: string): this;
  extensionMatch(key: string, matcher: (value: unknown) => void): this;

  // --- HTTP metadata ---
  status(code: number): this;

  // --- Performance ---
  durationLessThan(ms: number): this;
}

function expectGraphqlResponse(
  response: GraphqlResponse,
): GraphqlResponseExpectation;
```

## GraphqlClient

```typescript
/**
 * GraphQL connection configuration object.
 */
interface GraphqlConnectionConfig {
  /** Host name or IP address */
  readonly host: string;

  /** Port number */
  readonly port?: number;

  /** Protocol ("http" or "https") */
  readonly protocol?: "http" | "https";

  /** Path (e.g., "/graphql") */
  readonly path?: string;
}

interface GraphqlClientConfig extends CommonOptions {
  /** Server URL (string or config object) */
  readonly url: string | GraphqlConnectionConfig;
  readonly headers?: Record<string, string>;
  readonly wsUrl?: string;

  /**
   * Throw GraphqlClientError when GraphQL errors exist.
   * Overridable per request via GraphqlOptions.throwOnError.
   * @default true
   */
  readonly throwOnError?: boolean;
}

interface GraphqlClient extends AsyncDisposable {
  readonly config: GraphqlClientConfig;

  query(
    document: string,
    variables?: Record<string, unknown>,
    options?: GraphqlOptions,
  ): Promise<GraphqlResponse>;
  mutation(
    document: string,
    variables?: Record<string, unknown>,
    options?: GraphqlOptions,
  ): Promise<GraphqlResponse>;
  execute(
    document: string,
    variables?: Record<string, unknown>,
    options?: GraphqlOptions,
  ): Promise<GraphqlResponse>;
  subscribe(
    document: string,
    variables?: Record<string, unknown>,
    options?: GraphqlOptions,
  ): AsyncIterable<GraphqlResponse>;

  close(): Promise<void>;
}

interface GraphqlOptions extends CommonOptions {
  readonly headers?: Record<string, string>;

  /**
   * Throw GraphqlClientError when GraphQL errors exist.
   * Overrides GraphqlClientConfig.throwOnError.
   * @default true (when client config leaves it unset)
   */
  readonly throwOnError?: boolean;
}

function createGraphqlClient(config: GraphqlClientConfig): GraphqlClient;

// Convenience re-export
export { outdent } from "outdent";
```

## Examples

```typescript
import {
  createGraphqlClient,
  expectGraphqlResponse,
  outdent,
} from "@probitas/client-graphql";

const gql = createGraphqlClient({ url: "http://localhost:4000/graphql" });

// Without outdent: indentation is preserved
const withIndent = `
    query GetUser($id: ID!) {
      user(id: $id) { id name email }
    }
`;

// With outdent: shared indentation is stripped
const query = outdent`
    query GetUser($id: ID!) {
      user(id: $id) { id name email }
    }
`;

const res = await gql.query(query, { id: "123" });

expectGraphqlResponse(res).ok().noErrors();

const { user } = res.data<{ user: User }>()!;

// Using connection config object
const gqlWithConfig = createGraphqlClient({
  url: { host: "localhost", port: 4000, protocol: "http", path: "/graphql" },
});
```
