const request = require("supertest");
const app = require("../app");
const Otp = require("../models/Otp");

describe("Auth flow", () => {
  const user = { name: "Test User", email: "test@example.com", password: "password123", role: "resident" };

  const signupAndVerify = async (overrides = {}) => {
    const payload = { ...user, ...overrides };
    await request(app).post("/api/auth/signup").send(payload);
    const record = await Otp.findOne({ email: payload.email.toLowerCase() }).sort({ createdAt: -1 });
    return request(app).post("/api/auth/verify-email").send({ email: payload.email, code: record.code });
  };

  it("rejects signup with an invalid email", async () => {
    const res = await request(app).post("/api/auth/signup").send({ ...user, email: "not-an-email" });
    expect(res.statusCode).toBe(400);
  });

  it("signs up a new resident as unverified", async () => {
    const res = await request(app).post("/api/auth/signup").send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body.message).toBeDefined();
  });

  it("prevents duplicate signups with the same email", async () => {
    await request(app).post("/api/auth/signup").send(user);
    const res = await request(app).post("/api/auth/signup").send(user);
    expect(res.statusCode).toBe(400);
  });

  it("logs in with correct credentials once verified", async () => {
    const verifyRes = await signupAndVerify();
    expect(verifyRes.statusCode).toBe(200);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: user.email, password: user.password });
    expect(res.statusCode).toBe(200);
    expect(res.body.token).toBeDefined();
  });

  it("rejects login with the wrong password", async () => {
    await signupAndVerify();
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
    const verifyRes = await signupAndVerify();
    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${verifyRes.body.token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.email).toBe(user.email);
  });
});
