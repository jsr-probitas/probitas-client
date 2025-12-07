/**
 * GraphQL client for [Probitas](https://github.com/jsr-probitas/probitas) scenario testing framework.
 *
 * This package provides a GraphQL client with fluent assertion APIs, designed for
 * integration testing of GraphQL APIs.
 *
 * ## Features
 *
 * - **Query & Mutation**: Full support for GraphQL operations
 * - **Fluent Assertions**: Chain assertions like `.ok()`, `.dataContains()`, `.hasNoErrors()`
 * - **Variables Support**: Pass typed variables to queries and mutations
 * - **Duration Tracking**: Built-in timing for performance assertions
 * - **Error Inspection**: Assert on GraphQL errors and their structure
 * - **Resource Management**: Implements `AsyncDisposable` for proper cleanup
 * - **Template Literals**: Re-exports `outdent` for clean multi-line queries
 *
 * ## Installation
 *
 * ```bash
 * deno add jsr:@probitas/client-graphql
 * ```
 *
 * ## Quick Start
 *
 * ```ts
 * import {
 *   createGraphqlClient,
 *   expectGraphqlResponse,
 *   outdent,
 * } from "@probitas/client-graphql";
 *
 * const client = createGraphqlClient({ endpoint: "http://localhost:4000/graphql" });
 *
 * // Query with variables
 * const res = await client.query(outdent`
 *   query GetUser($id: ID!) {
 *     user(id: $id) { id name email }
 *   }
 * `, { id: "123" });
 *
 * expectGraphqlResponse(res)
 *   .ok()
 *   .hasNoErrors()
 *   .dataContains({ user: { id: "123" } })
 *   .durationLessThan(1000);
 *
 * // Mutation
 * const created = await client.mutation(outdent`
 *   mutation CreateUser($input: CreateUserInput!) {
 *     createUser(input: $input) { id name }
 *   }
 * `, { input: { name: "Jane", email: "jane@example.com" } });
 *
 * expectGraphqlResponse(created).ok();
 *
 * await client.close();
 * ```
 *
 * ## Using with `using` Statement
 *
 * ```ts
 * await using client = createGraphqlClient({ endpoint: "http://localhost:4000/graphql" });
 *
 * const res = await client.query(`{ __typename }`);
 * expectGraphqlResponse(res).ok();
 * // Client automatically closed when block exits
 * ```
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [`@probitas/client`](https://jsr.io/@probitas/client) | Core utilities and types |
 * | [`@probitas/client-http`](https://jsr.io/@probitas/client-http) | HTTP client |
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas-client)
 * - [Probitas Framework](https://github.com/jsr-probitas/probitas)
 *
 * @module
 */

export type * from "./types.ts";
export * from "./errors.ts";
export { createGraphqlClient } from "./client.ts";
export * from "./response.ts";
export * from "./expect.ts";
export { outdent } from "@cspotcode/outdent";
