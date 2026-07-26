const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const PG = require("../models/PG");
const bcrypt = require("bcryptjs");

const setupOwner = async (email = "o@test.com") => {
  const password = await bcrypt.hash("password123", 10);
  await User.create({ name: "Owner", email, password, role: "owner" });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  return login.body.token;
};

describe("PG management", () => {
  it("creates a PG for the logged-in owner", async () => {
    const token = await setupOwner();
    const res = await request(app)
      .post("/api/pg")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sunrise PG", address: "12 MG Road", city: "Bangalore" });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Sunrise PG");
  });

  it("rejects PG creation without required fields", async () => {
    const token = await setupOwner();
    const res = await request(app)
      .post("/api/pg")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sunrise PG" });
    expect(res.statusCode).toBe(400);
  });

  it("only lists active, non-archived PGs publicly", async () => {
    await setupOwner();
    const owner = await User.findOne({ email: "o@test.com" });
    await PG.create({ name: "Listed PG", address: "a", city: "Bangalore", owner: owner._id, isActive: true });
    await PG.create({ name: "Hidden PG", address: "a", city: "Bangalore", owner: owner._id, isActive: false });

    const res = await request(app).get("/api/pg");
    expect(res.statusCode).toBe(200);
    expect(res.body.pgs.some((p) => p.name === "Listed PG")).toBe(true);
    expect(res.body.pgs.some((p) => p.name === "Hidden PG")).toBe(false);
  });

  it("prevents a different owner from updating someone else's PG", async () => {
    const token = await setupOwner("o1@test.com");
    const create = await request(app)
      .post("/api/pg")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sunrise PG", address: "12 MG Road", city: "Bangalore" });

    const otherToken = await setupOwner("o2@test.com");
    const res = await request(app)
      .put(`/api/pg/${create.body._id}`)
      .set("Authorization", `Bearer ${otherToken}`)
      .send({ name: "Hijacked" });

    expect(res.statusCode).toBe(403);
  });

  it("toggles archive state on a PG", async () => {
    const token = await setupOwner();
    const create = await request(app)
      .post("/api/pg")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sunrise PG", address: "12 MG Road", city: "Bangalore" });

    const res = await request(app)
      .put(`/api/pg/${create.body._id}/archive`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.isArchived).toBe(true);
  });

  it("deletes a PG", async () => {
    const token = await setupOwner();
    const create = await request(app)
      .post("/api/pg")
      .set("Authorization", `Bearer ${token}`)
      .send({ name: "Sunrise PG", address: "12 MG Road", city: "Bangalore" });

    const res = await request(app)
      .delete(`/api/pg/${create.body._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(res.statusCode).toBe(200);

    const check = await PG.findById(create.body._id);
    expect(check).toBeNull();
  });
});