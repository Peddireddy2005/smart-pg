/**
 * Seeds the database with a demo owner, resident, PG, room and payment so
 * you can explore the app immediately after setup.
 *
 * Usage: npm run seed
 */
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
dotenv.config();

const User = require("./models/User");
const PG = require("./models/PG");
const Room = require("./models/Room");
const Payment = require("./models/Payment");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);
  console.log("Connected. Seeding...");

  await Promise.all([
    User.deleteMany({ email: { $in: ["owner@demo.com", "resident@demo.com"] } }),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);

  const owner = await User.create({
    name: "Demo Owner",
    email: "owner@demo.com",
    password: passwordHash,
    role: "owner",
    isVerified: true,
  });

  const pg = await PG.create({
    name: "Sunrise PG for Men",
    address: "12 MG Road, Indiranagar",
    city: "Bangalore",
    locality: "Indiranagar",
    description: "A well-maintained PG with home-cooked food and high-speed WiFi.",
    amenities: ["WiFi", "Food", "AC", "Laundry", "Parking"],
    contactPhone: "+91 98765 43210",
    rules: "No smoking. Gate closes at 11 PM.",
    owner: owner._id,
  });

  const room = await Room.create({
    roomNumber: "101",
    capacity: 2,
    occupancy: 0,
    rent: 9500,
    pg: pg._id,
    floor: "1st Floor",
    type: "Double",
  });
  await PG.findByIdAndUpdate(pg._id, { rentRange: { min: 9500, max: 9500 } });

  const resident = await User.create({
    name: "Demo Resident",
    email: "resident@demo.com",
    password: passwordHash,
    role: "resident",
    isVerified: true,
    assignedPG: pg._id,
    assignedRoom: room._id,
  });

  room.residents.push(resident._id);
  room.occupancy = 1;
  await room.save();

  const now = new Date();
  await Payment.create({
    resident: resident._id,
    room: room._id,
    pg: pg._id,
    amount: room.rent,
    month: now.getMonth() + 1,
    year: now.getFullYear(),
    status: "pending",
    dueDate: new Date(now.getFullYear(), now.getMonth(), 5),
  });

  console.log("Seed complete:");
  console.log("  Owner login:    owner@demo.com / password123");
  console.log("  Resident login: resident@demo.com / password123");

  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
