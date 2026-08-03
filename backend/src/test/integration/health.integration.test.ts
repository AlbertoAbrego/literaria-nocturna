import { testRequest } from "../helpers/request";

describe("GET /api/health", () => {
  it("TC-H1-001: responde 200 OK con el estado de la API", async () => {
    const res = await testRequest.get("/api/health");

    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
