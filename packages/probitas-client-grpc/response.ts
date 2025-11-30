import type { GrpcStatusCode } from "./status.ts";

/**
 * gRPC response interface.
 */
export interface GrpcResponse {
  /** Whether the request was successful (code === 0). */
  readonly ok: boolean;

  /** gRPC status code. */
  readonly code: GrpcStatusCode;

  /** Status message. */
  readonly message: string;

  /** Response body as protobuf binary, or null if no content. */
  readonly body: Uint8Array | null;

  /** Trailing metadata. */
  readonly metadata: Record<string, string>;

  /** Response time in milliseconds. */
  readonly duration: number;

  /**
   * Get deserialized data (returns null if body is null).
   *
   * Throws an error if no schema is available for deserialization.
   * Configure schema in GrpcClientConfig to enable deserialization.
   */
  data<T = unknown>(): T | null;

  /**
   * Parse body as JSON (returns null if body is null).
   * Does not require schema configuration.
   */
  json<T = unknown>(): T | null;
}

/**
 * Options for creating a GrpcResponse.
 */
export interface GrpcResponseOptions {
  readonly code: GrpcStatusCode;
  readonly message: string;
  readonly body: Uint8Array | null;
  readonly metadata: Record<string, string>;
  readonly duration: number;
  readonly deserializer?: (bytes: Uint8Array) => unknown;
}

const NO_SCHEMA_ERROR_MESSAGE =
  `Cannot deserialize gRPC response: no schema available.
Configure schema in GrpcClientConfig:
- Use server reflection (default, requires reflection-enabled server)
- Provide .proto file path: schema: './path/to/service.proto'
- Provide FileDescriptorSet: schema: await Deno.readFile('descriptor.pb')
Or use json() for JSON-encoded responses.`;

/**
 * Implementation of GrpcResponse.
 */
export class GrpcResponseImpl implements GrpcResponse {
  readonly ok: boolean;
  readonly code: GrpcStatusCode;
  readonly message: string;
  readonly body: Uint8Array | null;
  readonly metadata: Record<string, string>;
  readonly duration: number;

  readonly #deserializer?: (bytes: Uint8Array) => unknown;

  constructor(options: GrpcResponseOptions) {
    this.code = options.code;
    this.ok = options.code === 0;
    this.message = options.message;
    this.body = options.body;
    this.metadata = options.metadata;
    this.duration = options.duration;
    this.#deserializer = options.deserializer;
  }

  data<T = unknown>(): T | null {
    if (this.body === null) {
      return null;
    }
    if (!this.#deserializer) {
      throw new Error(NO_SCHEMA_ERROR_MESSAGE);
    }
    return this.#deserializer(this.body) as T;
  }

  json<T = unknown>(): T | null {
    if (this.body === null) {
      return null;
    }
    const text = new TextDecoder().decode(this.body);
    return JSON.parse(text) as T;
  }
}
