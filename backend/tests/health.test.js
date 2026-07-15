const request = require("supertest");
const app = require("../app");

describe("Health check", () => {
  it("GET /api/health returns ok status", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("ok");
  });

  it("GET /api/unknown-route returns 404 with a message", async () => {
    const res = await request(app).get("/api/unknown-route");
    expect(res.statusCode).toBe(404);
    expect(res.body.message).toMatch(/Route not found/);
  });
});
