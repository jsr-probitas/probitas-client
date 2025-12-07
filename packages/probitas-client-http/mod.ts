/**
 * HTTP client for [Probitas](https://github.com/jsr-probitas/probitas) scenario testing framework.
 *
 * This package provides an HTTP client with fluent assertion APIs, designed for
 * integration testing of HTTP APIs.
 *
 * ## Features
 *
 * - **Fluent Assertions**: Chain assertions like `.ok()`, `.contentType()`, `.jsonContains()`
 * - **All HTTP Methods**: Support for GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS
 * - **Request Building**: Headers, query parameters, body (JSON, form, multipart)
 * - **Response Inspection**: Status codes, headers, cookies, body parsing
 * - **Duration Tracking**: Built-in timing for performance assertions
 * - **Resource Management**: Implements `AsyncDisposable` for proper cleanup
 *
 * ## Installation
 *
 * ```bash
 * deno add jsr:@probitas/client-http
 * ```
 *
 * ## Quick Start
 *
 * ```ts
 * import { createHttpClient, expectHttpResponse } from "@probitas/client-http";
 *
 * const http = createHttpClient({ baseUrl: "http://localhost:3000" });
 *
 * // GET request with assertions
 * const res = await http.get("/users/123");
 * expectHttpResponse(res)
 *   .ok()
 *   .contentType("application/json")
 *   .jsonContains({ name: "John" });
 *
 * // Extract typed data
 * const user = res.json<User>();
 *
 * // POST request
 * const created = await http.post("/users", {
 *   headers: { "Content-Type": "application/json" },
 *   body: JSON.stringify({ name: "Jane" }),
 * });
 * expectHttpResponse(created).status(201);
 *
 * await http.close();
 * ```
 *
 * ## Using with `using` Statement
 *
 * ```ts
 * await using http = createHttpClient({ baseUrl: "http://localhost:3000" });
 *
 * const res = await http.get("/health");
 * expectHttpResponse(res).ok();
 * // Client automatically closed when block exits
 * ```
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [`@probitas/client`](https://jsr.io/@probitas/client) | Core utilities and types |
 * | [`@probitas/client-graphql`](https://jsr.io/@probitas/client-graphql) | GraphQL client |
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
export * from "./client.ts";
export * from "./response.ts";
export * from "./expect.ts";
