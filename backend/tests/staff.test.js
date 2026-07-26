const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const PG = require("../models/PG");
const bcrypt = require("bcryptjs");

const setupOwner = async (email = "o@test.com") => {
  const password = await bcrypt.hash("password123", 10);
  const owner = await User.create({ name: "Owner", email, password, role: "owner" });
  const pg = await PG.create({ name: "Test PG", address: "addr", city: "city", owner: owner._id });
  const login = await request(app).post("/api/auth/login").send({ email, password: "password123" });
  return { ownerToken: login.body.token, pg, owner };
};

describe("Staff management", () => {
  it("adds a staff member to a PG", async () => {
    const { ownerToken, pg } = await setupOwner();
    const res = await request(app)
      .post(`/api/staff/pg/${pg._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Ramesh", role: "Cleaner", phone: "9999999999", salary: 12000 });

    expect(res.statusCode).toBe(201);
    expect(res.body.name).toBe("Ramesh");
    expect(res.body.isActive).toBe(true);
  });

  it("marks and re-marks attendance for the same day in place", async () => {
    const { ownerToken, pg } = await setupOwner();
    const create = await request(app)
      .post(`/api/staff/pg/${pg._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Ramesh", role: "Cleaner" });

    const mark = await request(app)
      .put(`/api/staff/${create.body._id}/attendance`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ present: true });
    expect(mark.statusCode).toBe(200);
    expect(mark.body.attendance.length).toBe(1);
    expect(mark.body.attendance[0].present).toBe(true);

    const remark = await request(app)
      .put(`/api/staff/${create.body._id}/attendance`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ present: false });
    expect(remark.statusCode).toBe(200);
    expect(remark.body.attendance.length).toBe(1);
    expect(remark.body.attendance[0].present).toBe(false);
  });

  it("deactivates and removes a staff member", async () => {
    const { ownerToken, pg } = await setupOwner();
    const create = await request(app)
      .post(`/api/staff/pg/${pg._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Ramesh", role: "Cleaner" });

    const update = await request(app)
      .put(`/api/staff/${create.body._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ isActive: false });
    expect(update.body.isActive).toBe(false);

    const del = await request(app)
      .delete(`/api/staff/${create.body._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);
    expect(del.statusCode).toBe(200);
  });

  it("blocks another owner from managing staff that isn't theirs", async () => {
    const { ownerToken, pg } = await setupOwner();
    const create = await request(app)
      .post(`/api/staff/pg/${pg._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ name: "Ramesh", role: "Cleaner" });

    const password = await bcrypt.hash("password123", 10);
    await User.create({ name: "Other Owner", email: "o2@test.com", password, role: "owner" });
    const login = await request(app).post("/api/auth/login").send({ email: "o2@test.com", password: "password123" });

    const res = await request(app)
      .delete(`/api/staff/${create.body._id}`)
      .set("Authorization", `Bearer ${login.body.token}`);
    expect(res.statusCode).toBe(403);
  });
});