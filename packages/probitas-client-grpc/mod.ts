/**
 * gRPC client for Probitas.
 *
 * This package provides a gRPC client using ConnectRPC with gRPC protocol.
 * It is a thin wrapper around `@probitas/client-connectrpc` with `protocol: "grpc"` fixed.
 *
 * @example
 * ```typescript
 * import { createGrpcClient, expectGrpcResponse } from "@probitas/client-grpc";
 *
 * // Create client (uses reflection by default)
 * const client = createGrpcClient({
 *   address: "localhost:50051",
 * });
 *
 * // Call a method with fluent assertions
 * const response = await client.call(
 *   "echo.EchoService",
 *   "echo",
 *   { message: "Hello!" }
 * );
 *
 * expectGrpcResponse(response)
 *   .ok()
 *   .dataContains({ message: "Hello!" })
 *   .durationLessThan(1000);
 *
 * await client.close();
 * ```
 *
 * @module
 */

import {
  type ConnectRpcClient,
  type ConnectRpcClientConfig,
  createConnectRpcClient,
} from "@probitas/client-connectrpc";

// Re-export types and utilities from client-connectrpc with gRPC-specific aliases
export {
  // Client
  type ConnectRpcClient as GrpcClient,
  ConnectRpcError as GrpcError,
  type ConnectRpcErrorOptions as GrpcErrorOptions,
  ConnectRpcInternalError as GrpcInternalError,
  ConnectRpcNotFoundError as GrpcNotFoundError,
  type ConnectRpcOptions as GrpcOptions,
  ConnectRpcPermissionDeniedError as GrpcPermissionDeniedError,
  ConnectRpcResourceExhaustedError as GrpcResourceExhaustedError,
  // Response
  type ConnectRpcResponse as GrpcResponse,
  // Expect
  type ConnectRpcResponseExpectation as GrpcResponseExpectation,
  ConnectRpcStatus as GrpcStatus,
  // Status codes
  type ConnectRpcStatusCode as GrpcStatusCode,
  ConnectRpcUnauthenticatedError as GrpcUnauthenticatedError,
  ConnectRpcUnavailableError as GrpcUnavailableError,
  // Errors
  type ErrorDetail,
  expectConnectRpcResponse as expectGrpcResponse,
  type FileDescriptorSet,
  getStatusName as getGrpcStatusName,
  isConnectRpcStatusCode as isGrpcStatusCode,
  type MethodInfo,
  type ReflectionApi,
  type ServiceDetail,
  type ServiceInfo,
  // Types
  type TlsConfig,
} from "@probitas/client-connectrpc";

/**
 * Configuration for creating a gRPC client.
 *
 * This is a subset of ConnectRpcClientConfig with protocol fixed to "grpc".
 */
export interface GrpcClientConfig
  extends Omit<ConnectRpcClientConfig, "protocol"> {}

/**
 * Create a gRPC client.
 *
 * This is a thin wrapper around `createConnectRpcClient` with `protocol: "grpc"` fixed.
 *
 * @example
 * ```typescript
 * // Create client with reflection (default)
 * const client = createGrpcClient({
 *   address: "localhost:50051",
 * });
 *
 * // Call a method
 * const response = await client.call(
 *   "echo.EchoService",
 *   "echo",
 *   { message: "Hello!" }
 * );
 *
 * console.log(response.data());
 *
 * await client.close();
 * ```
 */
export function createGrpcClient(config: GrpcClientConfig): ConnectRpcClient {
  return createConnectRpcClient({
    ...config,
    protocol: "grpc",
  });
}
