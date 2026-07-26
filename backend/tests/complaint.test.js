const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const PG = require("../models/PG");
const Room = require("../models/Room");
const Complaint = require("../models/Complaint");
const Staff = require("../models/Staff");
const bcrypt = require("bcryptjs");

const setup = async () => {
  const password = await bcrypt.hash("password123", 10);
  const owner = await User.create({ name: "Owner", email: "o@test.com", password, role: "owner" });
  const pg = await PG.create({ name: "Test PG", address: "addr", city: "city", owner: owner._id });
  const room = await Room.create({ roomNumber: "101", capacity: 2, rent: 5000, pg: pg._id });
  const resident = await User.create({
    name: "Resident", email: "r@test.com", password, role: "resident",
    assignedPG: pg._id, assignedRoom: room._id,
  });

  const ownerLogin = await request(app).post("/api/auth/login").send({ email: "o@test.com", password: "password123" });
  const residentLogin = await request(app).post("/api/auth/login").send({ email: "r@test.com", password: "password123" });

  return { ownerToken: ownerLogin.body.token, residentToken: residentLogin.body.token, pg, room, resident, owner };
};

describe("Complaints", () => {
  it("lets a resident raise a complaint", async () => {
    const { residentToken } = await setup();
    const res = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${residentToken}`)
      .field("title", "WiFi down")
      .field("description", "No internet since morning")
      .field("category", "Internet")
      .field("priority", "high");

    expect(res.statusCode).toBe(201);
    expect(res.body.status).toBe("pending");
  });

  it("blocks a resident without an assigned PG from complaining", async () => {
    const password = await bcrypt.hash("password123", 10);
    await User.create({ name: "Loose Resident", email: "loose@test.com", password, role: "resident" });
    const login = await request(app).post("/api/auth/login").send({ email: "loose@test.com", password: "password123" });

    const res = await request(app)
      .post("/api/complaints")
      .set("Authorization", `Bearer ${login.body.token}`)
      .field("title", "WiFi down")
      .field("description", "No internet");

    expect(res.statusCode).toBe(400);
  });

  it("lets an owner update complaint status and assign staff", async () => {
    const { ownerToken, pg, room, resident, owner } = await setup();
    const staff = await Staff.create({ pg: pg._id, owner: owner._id, name: "Ramesh", role: "Electrician" });
    const complaint = await Complaint.create({ title: "Fan broken", description: "desc", pg: pg._id, room: room._id, resident: resident._id });

    const assignRes = await request(app)
      .put(`/api/complaints/${complaint._id}/assign`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ staffId: staff._id.toString() });
    expect(assignRes.statusCode).toBe(200);
    expect(assignRes.body.status).toBe("in-progress");

    const statusRes = await request(app)
      .put(`/api/complaints/${complaint._id}/status`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ status: "resolved" });
    expect(statusRes.statusCode).toBe(200);
    expect(statusRes.body.status).toBe("resolved");
  });

  it("lists complaints for the resident that filed them", async () => {
    const { residentToken, pg, room, resident } = await setup();
    await Complaint.create({ title: "Leaky tap", description: "desc", pg: pg._id, room: room._id, resident: resident._id });

    const res = await request(app).get("/api/complaints/my").set("Authorization", `Bearer ${residentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.length).toBe(1);
  });
});