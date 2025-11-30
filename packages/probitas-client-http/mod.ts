/**
 * @probitas/client-http - HTTP client for Probitas scenario testing framework.
 *
 * @example
 * ```ts
 * import { createHttpClient, expectHttpResponse } from "@probitas/client-http";
 *
 * const http = createHttpClient({ baseUrl: "http://localhost:3000" });
 *
 * const res = await http.get("/users/123");
 * expectHttpResponse(res)
 *   .ok()
 *   .contentType("application/json")
 *   .jsonContains({ name: "John" });
 *
 * const user = res.json<User>();
 *
 * await http.close();
 * ```
 *
 * @module
 */

export type * from "./types.ts";
export * from "./errors.ts";
export * from "./client.ts";
export * from "./response.ts";
export * from "./expect.ts";
