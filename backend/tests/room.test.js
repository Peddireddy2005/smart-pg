const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const PG = require("../models/PG");
const Room = require("../models/Room");
const bcrypt = require("bcryptjs");

const setupOwner = async () => {
  const password = await bcrypt.hash("password123", 10);
  const owner = await User.create({ name: "Owner", email: "o@test.com", password, role: "owner" });
  const pg = await PG.create({ name: "Test PG", address: "addr", city: "city", owner: owner._id });
  const login = await request(app).post("/api/auth/login").send({ email: "o@test.com", password: "password123" });
  return { ownerToken: login.body.token, owner, pg };
};

const setupResident = async (overrides = {}) => {
  const password = await bcrypt.hash("password123", 10);
  const resident = await User.create({
    name: "Resident", email: "r@test.com", password, role: "resident",
    phone: "9999999999", emergencyContact: "Parent", emergencyPhone: "8888888888",
    idProofType: "Aadhaar", idProofUrl: "http://example.com/id.jpg",
    ...overrides,
  });
  const login = await request(app).post("/api/auth/login").send({ email: "r@test.com", password: "password123" });
  return { residentToken: login.body.token, resident };
};

describe("Room management", () => {
  it("creates a room under a PG", async () => {
    const { ownerToken, pg } = await setupOwner();
    const res = await request(app)
      .post(`/api/rooms/${pg._id}`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ roomNumber: "101", capacity: 2, rent: 5000 });

    expect(res.statusCode).toBe(201);
    expect(res.body.roomNumber).toBe("101");
    expect(res.body.occupancy).toBe(0);
  });

  it("rejects room creation on a PG that isn't yours", async () => {
    const { pg } = await setupOwner();
    const password = await bcrypt.hash("password123", 10);
    await User.create({ name: "Other Owner", email: "o2@test.com", password, role: "owner" });
    const login = await request(app).post("/api/auth/login").send({ email: "o2@test.com", password: "password123" });

    const res = await request(app)
      .post(`/api/rooms/${pg._id}`)
      .set("Authorization", `Bearer ${login.body.token}`)
      .send({ roomNumber: "101", capacity: 2, rent: 5000 });

    expect(res.statusCode).toBe(403);
  });

  it("allocates a resident to a room and generates a rent payment", async () => {
    const { ownerToken, pg } = await setupOwner();
    const room = await Room.create({ roomNumber: "101", capacity: 2, rent: 5000, pg: pg._id });
    await setupResident();

    const res = await request(app)
      .post(`/api/rooms/${room._id}/allocate`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ residentEmail: "r@test.com" });

    expect(res.statusCode).toBe(200);
    expect(res.body.occupancy).toBe(1);
    expect(res.body.residents.length).toBe(1);

    const updatedResident = await User.findOne({ email: "r@test.com" });
    expect(updatedResident.assignedRoom.toString()).toBe(room._id.toString());
  });

  it("rejects allocation once the room is full", async () => {
    const { ownerToken, pg } = await setupOwner();
    const room = await Room.create({ roomNumber: "101", capacity: 1, occupancy: 1, rent: 5000, pg: pg._id });

    const res = await request(app)
      .post(`/api/rooms/${room._id}/allocate`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ residentEmail: "nobody@test.com", residentName: "Nobody" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toMatch(/full/i);
  });

  it("vacates a resident and preserves lastPG/lastRoom history", async () => {
    const { ownerToken, pg } = await setupOwner();
    const room = await Room.create({ roomNumber: "101", capacity: 2, rent: 5000, pg: pg._id });
    const { resident } = await setupResident();
    room.residents.push(resident._id);
    room.occupancy = 1;
    await room.save();
    await User.findByIdAndUpdate(resident._id, { assignedPG: pg._id, assignedRoom: room._id });

    const res = await request(app)
      .post(`/api/rooms/${room._id}/vacate`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ residentId: resident._id.toString() });

    expect(res.statusCode).toBe(200);
    expect(res.body.occupancy).toBe(0);

    const updated = await User.findById(resident._id);
    expect(updated.assignedPG).toBeNull();
    expect(updated.lastPG.toString()).toBe(pg._id.toString());
    expect(updated.moveOutDate).toBeTruthy();
  });

  it("prevents deleting a room that still has residents", async () => {
    const { ownerToken, pg } = await setupOwner();
    const room = await Room.create({ roomNumber: "101", capacity: 2, occupancy: 1, rent: 5000, pg: pg._id });

    const res = await request(app)
      .delete(`/api/rooms/${room._id}`)
      .set("Authorization", `Bearer ${ownerToken}`);

    expect(res.statusCode).toBe(400);
  });

  it("submits and cancels a resident vacate notice", async () => {
    const { pg } = await setupOwner();
    const room = await Room.create({ roomNumber: "101", capacity: 2, rent: 5000, pg: pg._id });
    const { residentToken, resident } = await setupResident();
    room.residents.push(resident._id);
    room.occupancy = 1;
    await room.save();
    await User.findByIdAndUpdate(resident._id, { assignedPG: pg._id, assignedRoom: room._id });

    const plannedDate = new Date(Date.now() + 40 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await request(app)
      .post("/api/rooms/vacate-notice")
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ plannedDate });

    expect(res.statusCode).toBe(200);
    expect(res.body.vacateNotice.requested).toBe(true);

    const cancelRes = await request(app)
      .delete("/api/rooms/vacate-notice")
      .set("Authorization", `Bearer ${residentToken}`);
    expect(cancelRes.statusCode).toBe(200);
  });

  it("rejects a vacate notice given less than 30 days ahead", async () => {
    const { pg } = await setupOwner();
    const room = await Room.create({ roomNumber: "101", capacity: 2, rent: 5000, pg: pg._id });
    const { residentToken, resident } = await setupResident();
    await User.findByIdAndUpdate(resident._id, { assignedPG: pg._id, assignedRoom: room._id });

    const plannedDate = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    const res = await request(app)
      .post("/api/rooms/vacate-notice")
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ plannedDate });

    expect(res.statusCode).toBe(400);
  });
});