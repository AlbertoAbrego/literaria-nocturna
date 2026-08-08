import { testRequest } from "../helpers/request";

describe("GET /api/docs", () => {
  it("TC-H10-005: Swagger documentation loads successfully", async () => {
    const res = await testRequest.get("/api/docs").redirects(1);
    // `.redirects(1)` follows swagger-ui-express's redirect from `/docs` to `/docs/`.

    expect(res.status).toBe(200);
    expect(res.text).toContain("swagger-ui");
  });

  it("TC-H10-006: All book endpoints appear in Swagger spec", async () => {
    const res = await testRequest.get("/api/docs/swagger.json");

    expect(res.status).toBe(200);
    expect(res.body.paths["/books"]).toBeDefined();
    expect(res.body.paths["/books/{id}"]).toBeDefined();
  });
});