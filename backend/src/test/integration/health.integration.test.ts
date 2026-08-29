import { testRequest } from "../helpers/request";

describe("Health endpoints", () => {
  describe("GET /api/health (liveness)", () => {
    it("TC-H1-001: return 200 OK with the API status", async () => {
      const res = await testRequest.get("/api/health");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.message).toBe("Literaria Nocturna API");
      expect(res.body.version).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });

    it("TC-H1-002: include version from package.json", async () => {
      const res = await testRequest.get("/api/health");

      expect(res.status).toBe(200);
      expect(typeof res.body.version).toBe("string");
      expect(res.body.version.length).toBeGreaterThan(0);
    });
  });

  describe("GET /api/health/ready (readiness)", () => {
    it("TC-H1-003: return 200 when database is connected", async () => {
      const res = await testRequest.get("/api/health/ready");

      expect(res.status).toBe(200);
      expect(res.body.status).toBe("ok");
      expect(res.body.database).toBe("connected");
      expect(res.body.version).toBeDefined();
      expect(res.body.timestamp).toBeDefined();
    });

    it("TC-H1-004: include database status field", async () => {
      const res = await testRequest.get("/api/health/ready");

      expect(res.status).toBe(200);
      expect(["connected", "disconnected", "connecting", "disconnecting", "unknown"]).toContain(
        res.body.database,
      );
    });
  });
});
