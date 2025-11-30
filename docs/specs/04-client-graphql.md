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
  // --- Status checks ---
  ok(): this;

  // --- Error checks ---
  noErrors(): this;
  error(messageMatcher: string | RegExp): this;
  errorMatch(matcher: (errors: readonly GraphqlError[]) => void): this;

  // --- Data checks ---
  noContent(): this;
  hasContent(): this;
  dataContains<T = any>(subset: Partial<T>): this;
  dataMatch<T = any>(matcher: (data: T) => void): this;

  // --- Performance ---
  durationLessThan(ms: number): this;
}

function expectGraphqlResponse(
  response: GraphqlResponse,
): GraphqlResponseExpectation;
```

## GraphqlClient

```typescript
interface GraphqlClientConfig extends CommonOptions {
  readonly endpoint: string;
  readonly headers?: Record<string, string>;
  readonly wsEndpoint?: string;

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
  mutate(
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

const gql = createGraphqlClient({ endpoint: "http://localhost:4000/graphql" });

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
```
