const request = require("supertest");
const app = require("../app");
const User = require("../models/User");
const PG = require("../models/PG");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const bcrypt = require("bcryptjs");

const setupOwnerAndResident = async () => {
  const password = await bcrypt.hash("password123", 10);
  const owner = await User.create({ name: "Owner", email: "o@test.com", password, role: "owner", upiId: "owner@ybl" });
  const pg = await PG.create({ name: "Test PG", address: "addr", city: "city", owner: owner._id });
  const room = await Room.create({ roomNumber: "1", capacity: 2, rent: 5000, pg: pg._id });
  const resident = await User.create({ name: "Resident", email: "r@test.com", password, role: "resident", assignedPG: pg._id, assignedRoom: room._id });
  const payment = await Payment.create({ resident: resident._id, room: room._id, pg: pg._id, amount: 5000, month: 1, year: 2026 });

  const ownerLogin = await request(app).post("/api/auth/login").send({ email: "o@test.com", password: "password123" });
  const residentLogin = await request(app).post("/api/auth/login").send({ email: "r@test.com", password: "password123" });

  return { ownerToken: ownerLogin.body.token, residentToken: residentLogin.body.token, payment };
};

describe("Payment methods", () => {
  it("shows all three payment options to a resident", async () => {
    const { residentToken, payment } = await setupOwnerAndResident();
    const res = await request(app).get(`/api/payments/${payment._id}/options`).set("Authorization", `Bearer ${residentToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.methods.razorpay).toBe(true);
    expect(res.body.methods.upi).toBe(true);
    expect(res.body.methods.cash).toBe(true);
    expect(res.body.upi.qrDataUrl).toMatch(/^data:image/);
  });

  it("puts a cash claim into pending_approval and lets the owner approve it", async () => {
    const { ownerToken, residentToken, payment } = await setupOwnerAndResident();

    const submitRes = await request(app)
      .post(`/api/payments/${payment._id}/submit-cash`)
      .set("Authorization", `Bearer ${residentToken}`)
      .send({ amount: 5000, notes: "Paid at reception" });
    expect(submitRes.statusCode).toBe(200);
    expect(submitRes.body.status).toBe("pending_approval");

    const requests = await request(app).get("/api/payments/owner/requests").set("Authorization", `Bearer ${ownerToken}`);
    expect(requests.body.length).toBe(1);

    const approveRes = await request(app).put(`/api/payments/${payment._id}/approve`).set("Authorization", `Bearer ${ownerToken}`);
    expect(approveRes.statusCode).toBe(200);
    expect(approveRes.body.status).toBe("paid");
    expect(approveRes.body.verifiedBy).toBe("owner");
  });

  it("lets the owner reject a pending claim with a reason", async () => {
    const { ownerToken, residentToken, payment } = await setupOwnerAndResident();
    await request(app).post(`/api/payments/${payment._id}/submit-cash`).set("Authorization", `Bearer ${residentToken}`).send({ amount: 5000 });

    const res = await request(app)
      .put(`/api/payments/${payment._id}/reject`)
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ reason: "Amount mismatch" });
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("rejected");
    expect(res.body.rejectionReason).toBe("Amount mismatch");
  });

  it("lets the owner update payment settings", async () => {
    const { ownerToken } = await setupOwnerAndResident();
    const res = await request(app)
      .put("/api/payments/settings")
      .set("Authorization", `Bearer ${ownerToken}`)
      .send({ upiId: "newupi@ybl", cash: false });
    expect(res.statusCode).toBe(200);
    expect(res.body.upiId).toBe("newupi@ybl");
    expect(res.body.paymentMethodsEnabled.cash).toBe(false);
  });
});
