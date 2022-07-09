import { createMocks } from "node-mocks-http";
import { requestHandler } from "../request";
import { BadRequestError } from "../errors";

describe("/api/requestHandler", () => {
  it("should call 'GET' correctly and pass queries", async () => {
    const { req, res } = createMocks({
      method: "GET",
      query: {
        foo: "test_name",
      },
    });

    await requestHandler({
      GET: async (req$) => {
        return { foo: req$.query.foo };
      },
    })(req, res);

    expect(res._getStatusCode()).toBe(200);
    expect(res._getJSONData()).toEqual({ foo: "test_name" });
  });

  it("should call 'POST' correctly and pass body request", async () => {
    const { req, res } = createMocks({
      method: "POST",
      body: {
        foo: "test_input",
      },
    });

    await requestHandler({
      POST: async (req$1) => {
        return { foo: req$1.body.foo };
      },
    })(req, res);

    expect(res._getStatusCode()).toBe(201);
    expect(res._getJSONData()).toEqual({ foo: "test_input" });
  });

  it("should call error on non implemented request method", async () => {
    const { req, res } = createMocks({
      method: "OPTIONS",
    });

    await requestHandler({})(req, res);

    expect(res._getStatusCode()).toBe(405);
    expect(res._getData()).toBe("Method 'OPTIONS' Not Allowed");
  });

  it("should call handle errors thrown to HTTP responses", async () => {
    const { req, res } = createMocks({
      method: "PUT",
    });

    await requestHandler({
      PUT: async () => {
        throw new BadRequestError("Name is required");
      },
    })(req, res);

    expect(res._getStatusCode()).toBe(400);
    expect(res._getJSONData()).toMatchInlineSnapshot(`
      Object {
        "message": "Name is required",
        "name": "BadRequestError",
      }
    `);
  });
});