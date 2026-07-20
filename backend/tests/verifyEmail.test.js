const request = require("supertest");
const app = require("../app");
const Otp = require("../models/Otp");

describe("Email verification flow", () => {
  const user = { name: "OTP User", email: "otpuser@example.com", password: "password123", role: "resident" };

  it("signs up a new resident as unverified and does not return a token", async () => {
    const res = await request(app).post("/api/auth/signup").send(user);
    expect(res.statusCode).toBe(201);
    expect(res.body.token).toBeUndefined();
    expect(res.body.email).toBe(user.email);
  });

  it("blocks login until the email is verified", async () => {
    await request(app).post("/api/auth/signup").send({ ...user, email: "unverified@example.com" });
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "unverified@example.com", password: user.password });
    expect(res.statusCode).toBe(403);
  });

  it("rejects verification with a wrong code", async () => {
    await request(app).post("/api/auth/signup").send({ ...user, email: "wrongcode@example.com" });
    const res = await request(app)
      .post("/api/auth/verify-email")
      .send({ email: "wrongcode@example.com", code: "000000" });
    expect(res.statusCode).toBe(400);
  });

  it("verifies the correct code and logs the user in", async () => {
    const email = "verifyme@example.com";
    await request(app).post("/api/auth/signup").send({ ...user, email });
    const record = await Otp.findOne({ email }).sort({ createdAt: -1 });

    const verifyRes = await request(app)
      .post("/api/auth/verify-email")
      .send({ email, code: record.code });
    expect(verifyRes.statusCode).toBe(200);
    expect(verifyRes.body.token).toBeDefined();

    const loginRes = await request(app).post("/api/auth/login").send({ email, password: user.password });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.token).toBeDefined();
  });

  it("resend-otp returns a generic response even for unknown emails", async () => {
    const res = await request(app).post("/api/auth/resend-otp").send({ email: "doesnotexist@example.com" });
    expect(res.statusCode).toBe(200);
  });
});
