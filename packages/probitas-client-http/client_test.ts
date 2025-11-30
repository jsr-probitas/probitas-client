import { assertEquals, assertInstanceOf, assertRejects } from "@std/assert";
import { createHttpClient } from "./client.ts";
import { HttpNotFoundError } from "./errors.ts";

function createMockFetch(
  handler: (req: Request) => Response | Promise<Response>,
): typeof fetch {
  return (input: RequestInfo | URL, init?: RequestInit) => {
    const request = new Request(input, init);
    return Promise.resolve(handler(request));
  };
}

Deno.test("createHttpClient", async (t) => {
  await t.step("returns HttpClient with config", () => {
    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
    });
    assertEquals(client.config.baseUrl, "http://localhost:3000");
  });

  await t.step("implements AsyncDisposable", async () => {
    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
    });
    // Check that client has Symbol.asyncDispose
    assertEquals(typeof client[Symbol.asyncDispose], "function");
    await client.close();
  });
});

Deno.test("HttpClient.get", async (t) => {
  await t.step("sends GET request to correct URL", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.get("/users/1");
    await client.close();

    assertEquals(capturedRequest?.method, "GET");
    assertEquals(capturedRequest?.url, "http://localhost:3000/users/1");
  });

  await t.step("returns HttpResponse with body", async () => {
    const mockFetch = createMockFetch(() => {
      return new Response(JSON.stringify({ id: 1, name: "John" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    const response = await client.get("/users/1");
    await client.close();

    assertEquals(response.ok, true);
    assertEquals(response.status, 200);
    assertEquals(response.json(), { id: 1, name: "John" });
  });

  await t.step("includes query parameters", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("[]", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.get("/search", {
      query: { q: "test", limit: 10, active: true },
    });
    await client.close();

    const url = new URL(capturedRequest!.url);
    assertEquals(url.searchParams.get("q"), "test");
    assertEquals(url.searchParams.get("limit"), "10");
    assertEquals(url.searchParams.get("active"), "true");
  });

  await t.step("supports array query parameters", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("[]", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.get("/filter", {
      query: { tags: ["a", "b", "c"] },
    });
    await client.close();

    const url = new URL(capturedRequest!.url);
    assertEquals(url.searchParams.getAll("tags"), ["a", "b", "c"]);
  });

  await t.step("merges headers from config and options", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      headers: { Authorization: "Bearer token123", "X-Custom": "from-config" },
      fetch: mockFetch,
    });

    await client.get("/protected", {
      headers: { "X-Request-Id": "abc123" },
    });
    await client.close();

    assertEquals(
      capturedRequest?.headers.get("Authorization"),
      "Bearer token123",
    );
    assertEquals(capturedRequest?.headers.get("X-Custom"), "from-config");
    assertEquals(capturedRequest?.headers.get("X-Request-Id"), "abc123");
  });
});

Deno.test("HttpClient.post", async (t) => {
  await t.step("sends POST request with JSON body", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response(JSON.stringify({ id: 1 }), { status: 201 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.post("/users", { name: "John", email: "john@example.com" });
    await client.close();

    assertEquals(capturedRequest?.method, "POST");
    assertEquals(
      capturedRequest?.headers.get("Content-Type"),
      "application/json",
    );
    const body = await capturedRequest?.json();
    assertEquals(body, { name: "John", email: "john@example.com" });
  });

  await t.step("sends POST request with string body", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.post("/text", "plain text body");
    await client.close();

    assertEquals(capturedRequest?.method, "POST");
    const body = await capturedRequest?.text();
    assertEquals(body, "plain text body");
  });

  await t.step("sends POST request with Uint8Array body", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    const binary = new Uint8Array([1, 2, 3, 4, 5]);
    await client.post("/upload", binary);
    await client.close();

    assertEquals(capturedRequest?.method, "POST");
    const body = new Uint8Array(await capturedRequest!.arrayBuffer());
    assertEquals(body, binary);
  });

  await t.step("sends POST request with URLSearchParams body", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    const params = new URLSearchParams({ foo: "bar", baz: "qux" });
    await client.post("/form", params);
    await client.close();

    assertEquals(capturedRequest?.method, "POST");
    const body = await capturedRequest?.text();
    assertEquals(body, "foo=bar&baz=qux");
  });
});

Deno.test("HttpClient.put", async (t) => {
  await t.step("sends PUT request", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.put("/users/1", { name: "Updated" });
    await client.close();

    assertEquals(capturedRequest?.method, "PUT");
    assertEquals(capturedRequest?.url, "http://localhost:3000/users/1");
  });
});

Deno.test("HttpClient.patch", async (t) => {
  await t.step("sends PATCH request", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response(JSON.stringify({ id: 1 }), { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.patch("/users/1", { name: "Patched" });
    await client.close();

    assertEquals(capturedRequest?.method, "PATCH");
    assertEquals(capturedRequest?.url, "http://localhost:3000/users/1");
  });
});

Deno.test("HttpClient.delete", async (t) => {
  await t.step("sends DELETE request", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response(null, { status: 204 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.delete("/users/1");
    await client.close();

    assertEquals(capturedRequest?.method, "DELETE");
    assertEquals(capturedRequest?.url, "http://localhost:3000/users/1");
  });
});

Deno.test("HttpClient.request", async (t) => {
  await t.step("sends request with arbitrary method", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.request("OPTIONS", "/resource");
    await client.close();

    assertEquals(capturedRequest?.method, "OPTIONS");
    assertEquals(capturedRequest?.url, "http://localhost:3000/resource");
  });

  await t.step("supports body in request options", async () => {
    let capturedRequest: Request | undefined;
    const mockFetch = createMockFetch((req) => {
      capturedRequest = req;
      return new Response("ok", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await client.request("PATCH", "/resource", { body: { data: "value" } });
    await client.close();

    assertEquals(capturedRequest?.method, "PATCH");
    const body = await capturedRequest?.json();
    assertEquals(body, { data: "value" });
  });
});

Deno.test("HttpClient error handling", async (t) => {
  await t.step("throws HttpNotFoundError for 404", async () => {
    const mockFetch = createMockFetch(() => {
      return new Response("Not Found", {
        status: 404,
        statusText: "Not Found",
      });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    const error = await assertRejects(
      () => client.get("/missing"),
      HttpNotFoundError,
    );
    assertInstanceOf(error, HttpNotFoundError);
    assertEquals(error.status, 404);
    await client.close();
  });
});

Deno.test("HttpClient response duration", async (t) => {
  await t.step("includes duration in response", async () => {
    const mockFetch = createMockFetch(() => {
      return new Response("ok", { status: 200 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    const response = await client.get("/test");
    await client.close();

    assertEquals(typeof response.duration, "number");
    assertEquals(response.duration >= 0, true);
  });
});

Deno.test("HttpClient throwOnError option", async (t) => {
  await t.step("throws by default for 4xx response", async () => {
    const mockFetch = createMockFetch(() => {
      return new Response("Not Found", { status: 404 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    await assertRejects(() => client.get("/missing"), HttpNotFoundError);
    await client.close();
  });

  await t.step(
    "returns response when throwOnError: false in request options",
    async () => {
      const mockFetch = createMockFetch(() => {
        return new Response("Not Found", {
          status: 404,
          statusText: "Not Found",
        });
      });

      const client = createHttpClient({
        baseUrl: "http://localhost:3000",
        fetch: mockFetch,
      });

      const response = await client.get("/missing", { throwOnError: false });
      await client.close();

      assertEquals(response.ok, false);
      assertEquals(response.status, 404);
      assertEquals(response.statusText, "Not Found");
    },
  );

  await t.step(
    "returns response when throwOnError: false in client config",
    async () => {
      const mockFetch = createMockFetch(() => {
        return new Response("Server Error", {
          status: 500,
          statusText: "Internal Server Error",
        });
      });

      const client = createHttpClient({
        baseUrl: "http://localhost:3000",
        fetch: mockFetch,
        throwOnError: false,
      });

      const response = await client.get("/error");
      await client.close();

      assertEquals(response.ok, false);
      assertEquals(response.status, 500);
    },
  );

  await t.step(
    "request option overrides client config (true overrides false)",
    async () => {
      const mockFetch = createMockFetch(() => {
        return new Response("Not Found", { status: 404 });
      });

      const client = createHttpClient({
        baseUrl: "http://localhost:3000",
        fetch: mockFetch,
        throwOnError: false,
      });

      await assertRejects(
        () => client.get("/missing", { throwOnError: true }),
        HttpNotFoundError,
      );
      await client.close();
    },
  );

  await t.step(
    "request option overrides client config (false overrides true)",
    async () => {
      const mockFetch = createMockFetch(() => {
        return new Response("Not Found", { status: 404 });
      });

      const client = createHttpClient({
        baseUrl: "http://localhost:3000",
        fetch: mockFetch,
        throwOnError: true,
      });

      const response = await client.get("/missing", { throwOnError: false });
      await client.close();

      assertEquals(response.ok, false);
      assertEquals(response.status, 404);
    },
  );

  await t.step("works with POST method", async () => {
    const mockFetch = createMockFetch(() => {
      return new Response("Bad Request", { status: 400 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    const response = await client.post("/data", { invalid: "data" }, {
      throwOnError: false,
    });
    await client.close();

    assertEquals(response.status, 400);
  });

  await t.step("works with request method", async () => {
    const mockFetch = createMockFetch(() => {
      return new Response("Method Not Allowed", { status: 405 });
    });

    const client = createHttpClient({
      baseUrl: "http://localhost:3000",
      fetch: mockFetch,
    });

    const response = await client.request("CUSTOM", "/resource", {
      throwOnError: false,
    });
    await client.close();

    assertEquals(response.status, 405);
  });
});
