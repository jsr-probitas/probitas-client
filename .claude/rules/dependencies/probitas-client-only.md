---
globs: **/*.ts
---

# Probitas Package Dependency Restriction

This package (`probitas-client`) MUST NOT depend on any `@probitas/*` packages
except `@probitas/client` itself.

## Allowed

- `@probitas/client` - The main client package (this package exports it)
- `@probitas/client-connectrpc` - Only from `@probitas/client-grpc` package
- `@probitas/client-sql` - Only from `@probitas/client-sql-xxxxx` packages

## Forbidden

- `@probitas/core` - Use vendored or local implementations instead
- `@probitas/scenario` - This is a consumer package, not a dependency
- Any other `@probitas/*` packages

## Rationale

`probitas-client` is a foundational library that other Probitas packages depend
on. Creating reverse dependencies would cause circular dependency issues.
