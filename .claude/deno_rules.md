# Deno/TypeScript Rules

Language-specific conventions and patterns for Probitas Client packages.

## Module Organization

- **Single entry point**: Each package exports through `mod.ts`
- **Use `export *`**: Prefer `export *` over explicit `export { ... }` in mod.ts
- **Type-only exports**: Use `export type *` for types (tree-shaking)
- **Colocated tests**: `*_test.ts` files adjacent to implementation

### Export Strategy

Each implementation file should export only what is needed for public API:

```ts
// client.ts - Export only public API
export class HttpClient {/* ... */}
export type { HttpClientOptions };

// Internal helpers stay unexported
function internalHelper() {/* ... */}
```

Entry point files (`mod.ts`) use `export *` to re-export:

```ts
// mod.ts
export * from "./client.ts";
export * from "./result.ts";
export type * from "./types.ts"; // Type-only for tree-shaking
```

### Exporting for Tests

When internal functions need to be tested, use `_internal` namespace:

```ts
// parser.ts
function parseValue(input: string): Value {
  // Implementation
}

// Public API
export function parse(input: string): Value {
  return parseValue(input);
}

// Export internals for testing only
export const _internal = {
  parseValue,
};
```

The `_internal` prefix signals "not part of public API" while keeping exports
minimal and intentional. Note that `_internal` should not be re-exported from
`mod.ts`.

## File Naming Conventions

```
mod.ts           # Package root entry point (only at root)
types.ts         # Public type definitions
_testutils.ts    # Test utilities (not exported)
_typeutils.ts    # Type utilities (not exported)
```

Underscore prefix (`_*.ts`) indicates internal-only files that are not exported
from `mod.ts` and should not be used outside the package.

## Package Config (deno.json)

```json
{
  "name": "@probitas/client-{name}",
  "version": "0.0.7",
  "exports": "./mod.ts",
  "publish": {
    "exclude": ["**/*_test.ts", "**/*_bench.ts"]
  }
}
```

## Documentation Comments

Code examples in JSDoc comments must be type-checked. Use `@example` tags with
proper TypeScript code blocks:

````ts
/**
 * Creates an HTTP client for testing.
 *
 * @example
 * ```ts
 * import { HttpClient } from "@probitas/client-http";
 * await using client = new HttpClient({ baseUrl: "http://localhost:8080" });
 * const result = await client.get("/api/users");
 * ```
 */
export class HttpClient implements AsyncDisposable {
  // ...
}
````

Deno's `deno test --doc` validates these examples during CI.

## Private Fields

Use `#private` syntax instead of TypeScript's `private` keyword:

```ts
// Good - Runtime-enforced privacy
class HttpClient {
  #baseUrl: string;
  #options: Options;

  constructor(options: Options) {
    this.#baseUrl = options.baseUrl;
    this.#options = options;
  }
}

// Bad - Only compile-time privacy
class HttpClient {
  private baseUrl: string;
}
```

Benefits of `#private`:

- Runtime enforcement (not just compile-time)
- Works correctly with inheritance
- Cannot be accessed via bracket notation

## Custom Error Classes

Custom error classes must set `this.name` for cross-process safety:

```ts
export class ClientError extends Error {
  readonly kind: string;

  constructor(message: string, kind: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "ClientError"; // Required for Worker boundary safety
    this.kind = kind;
  }
}
```

## Disposable Patterns

Use `AsyncDisposableStack` for guaranteed cleanup:

```ts
async function runWithResources() {
  await using stack = new AsyncDisposableStack();

  const client = new HttpClient(options);
  stack.defer(async () => await client[Symbol.asyncDispose]());

  // Client is automatically cleaned up when scope exits
}
```

All client classes implement `AsyncDisposable`:

```ts
export class HttpClient implements AsyncDisposable {
  async [Symbol.asyncDispose](): Promise<void> {
    // Close connections, release resources
  }
}

// Usage with explicit resource management
await using client = new HttpClient(options);
const result = await client.get("/api");
// Client automatically disposed when scope exits
```

## Test Helper Factories

Place test utilities in `_testutils.ts` with factory functions:

```ts
// _testutils.ts
export function createMockResponse(
  overrides?: Partial<ResponseInit>,
): Response {
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { "content-type": "application/json" },
    ...overrides,
  });
}
```

## Development Environment

- A Nix flake is provided to supply the Deno toolchain without global installs.
- Enter the shell with `nix develop`, or add `use flake` to `.envrc` and
  `direnv allow` for auto-activation.
