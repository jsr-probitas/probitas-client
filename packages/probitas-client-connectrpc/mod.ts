/**
 * ConnectRPC client for [Probitas](https://github.com/jsr-probitas/probitas) scenario testing framework.
 *
 * This package provides a ConnectRPC-based client with Server Reflection support,
 * designed for integration testing of gRPC and Connect protocol services.
 *
 * ## Features
 *
 * - **Protocol Support**: Connect, gRPC, and gRPC-Web protocols
 * - **Server Reflection**: Auto-discover services and methods at runtime
 * - **Fluent Assertions**: Chain assertions like `.ok()`, `.dataContains()`, `.code()`
 * - **TLS Support**: Configure secure connections with custom certificates
 * - **Duration Tracking**: Built-in timing for performance assertions
 * - **Error Handling**: Test error responses without throwing exceptions
 * - **Resource Management**: Implements `AsyncDisposable` for proper cleanup
 *
 * ## Installation
 *
 * ```bash
 * deno add jsr:@probitas/client-connectrpc
 * ```
 *
 * ## Quick Start
 *
 * ```ts
 * import { createConnectRpcClient, expectConnectRpcResponse } from "@probitas/client-connectrpc";
 *
 * // Create client (uses reflection by default)
 * const client = createConnectRpcClient({
 *   url: "http://localhost:50051",
 * });
 *
 * // Discover services via reflection
 * const services = await client.reflection.listServices();
 * console.log("Available services:", services);
 *
 * // Get service info
 * const info = await client.reflection.getServiceInfo("echo.EchoService");
 * console.log("Methods:", info.methods);
 *
 * // Call a method with fluent assertions
 * const response = await client.call(
 *   "echo.EchoService",
 *   "echo",
 *   { message: "Hello!" }
 * );
 *
 * expectConnectRpcResponse(response)
 *   .ok()
 *   .dataContains({ message: "Hello!" })
 *   .durationLessThan(1000);
 *
 * await client.close();
 * ```
 *
 * ## Testing Error Responses
 *
 * ```ts
 * // Test error responses without throwing
 * const errorResponse = await client.call(
 *   "echo.EchoService",
 *   "echo",
 *   { invalid: true },
 *   { throwOnError: false }
 * );
 *
 * expectConnectRpcResponse(errorResponse)
 *   .notOk()
 *   .code(3)  // INVALID_ARGUMENT
 *   .errorContains("invalid");
 * ```
 *
 * ## Using with `using` Statement
 *
 * ```ts
 * await using client = createConnectRpcClient({ url: "http://localhost:50051" });
 *
 * const res = await client.call("echo.EchoService", "echo", { message: "test" });
 * expectConnectRpcResponse(res).ok();
 * // Client automatically closed when block exits
 * ```
 *
 * ## Related Packages
 *
 * | Package | Description |
 * |---------|-------------|
 * | [`@probitas/client`](https://jsr.io/@probitas/client) | Core utilities and types |
 * | [`@probitas/client-grpc`](https://jsr.io/@probitas/client-grpc) | gRPC client (wrapper with `protocol: "grpc"`) |
 *
 * ## Links
 *
 * - [GitHub Repository](https://github.com/jsr-probitas/probitas-client)
 * - [Probitas Framework](https://github.com/jsr-probitas/probitas)
 * - [ConnectRPC](https://connectrpc.com/)
 *
 * @module
 */

export type * from "./status.ts";
export * from "./status.ts";

export type * from "./errors.ts";
export * from "./errors.ts";

export type * from "./types.ts";
export * from "./types.ts";

export type * from "./response.ts";
export * from "./response.ts";

export type * from "./expect.ts";
export * from "./expect.ts";

export type * from "./client.ts";
export * from "./client.ts";
