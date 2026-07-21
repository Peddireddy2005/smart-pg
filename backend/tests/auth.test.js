const request = require("supertest");
const app = require("../app");

describe("Auth flow", () => {
  const user = { name: "Test User", email: "test@example.com", password: "password123", role: "resident" };

  it("rejects signup with an invalid email", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...user, email: "not-an-email" });
    expect(res.statusCode).toBe(400);
  });

  it("signs up a new resident and logs them in immediately", async () => {
    const res = await request(app).post("/api/auth/signup").send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeDefined();
    expect(res.body.email).toBe(user.email);
  });

  it("prevents duplicate signups with the same email", async () => {
    await request(app).post("/api/auth/signup").send(user);
    const res = await request(app).post("/api/auth/signup").send(user);
    expect(res.statusCode).toBe(400);
  });

  it("logs in with correct credentials", async () => {
    await request(app).post("/api/auth/signup").send(user);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects login with the wrong password", async () => {
    await request(app).post("/api/auth/signup").send(user);
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: "wrongpassword" });
    expect(res.statusCode).toBe(400);
  });

  it("blocks /auth/me without a token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.statusCode).toBe(401);
  });

  it("returns the profile with a valid token", async () => {
    const signupRes = await request(app).post("/api/auth/signup").send(user);
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${signupRes.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(user.email);
  });
});