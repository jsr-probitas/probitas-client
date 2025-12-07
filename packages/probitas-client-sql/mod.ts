/**
 * Common SQL types and utilities for [Probitas](https://github.com/jsr-probitas/probitas) SQL client packages.
 *
 * This package provides shared types, result classes, errors, and expectations
 * used across all SQL-related client packages.
 *
 * ## Features
 *
 * - **Query Results**: `SqlQueryResult` class with row iteration and metadata
 * - **Transactions**: Common transaction interface with isolation levels
 * - **Error Hierarchy**: SQL-specific errors (`SqlError`, `QuerySyntaxError`, `ConstraintError`, `DeadlockError`)
 * - **Fluent Assertions**: `expectSqlQueryResult()` for testing query results
 *
 * ## Installation
 *
 * ```bash
 * deno add jsr:@probitas/client-sql
 * ```
 *
 * ## Usage
 *
 * This package is typically used as a dependency by database-specific packages.
 * End users should import from the specific database client packages instead.
 *
 * ```ts
 * import {
 *   SqlQueryResult,
 *   SqlError,
 *   ConstraintError,
 *   expectSqlQueryResult,
 * } from "@probitas/client-sql";
 * import type { SqlTransaction, SqlIsolationLevel } from "@probitas/client-sql";
 *
 * // Assert on query results
 * expectSqlQueryResult(result)
 *   .hasRowCount(3)
 *   .rowsContain({ name: "Alice" });
 *
 * // Handle SQL errors
 * try {
 *   await client.query("INSERT INTO users (email) VALUES ($1)", ["duplicate@example.com"]);
 * } catch (error) {
 *   if (error instanceof ConstraintError) {
 *     console.log("Constraint violation:", error.constraint);
 *   }
 * }
 * ```
 *
 * ## Database-Specific Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [`@probitas/client-sql-postgres`](https://jsr.io/@probitas/client-sql-postgres) | PostgreSQL client |
 * | [`@probitas/client-sql-mysql`](https://jsr.io/@probitas/client-sql-mysql) | MySQL client |
 * | [`@probitas/client-sql-sqlite`](https://jsr.io/@probitas/client-sql-sqlite) | SQLite client |
 * | [`@probitas/client-sql-duckdb`](https://jsr.io/@probitas/client-sql-duckdb) | DuckDB client |
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas-client)
 * - [Probitas Framework](https://github.com/jsr-probitas/probitas)
 *
 * @module
 */

export * from "./rows.ts";
export type * from "./result.ts";
export * from "./result.ts";
export type * from "./transaction.ts";
export type * from "./errors.ts";
export * from "./errors.ts";
export type * from "./expectation.ts";
export * from "./expectation.ts";
