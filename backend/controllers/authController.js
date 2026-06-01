const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) => {
  console.log("[AUTH] Generating JWT for user ID:", id);
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

const signup = async (req, res) => {
  console.log("[SIGNUP] Request received:", req.body);
  const { name, email, password, role } = req.body;
  try {
    console.log("[SIGNUP] Checking if user already exists:", email);
    const exists = await User.findOne({ email });
    if (exists) {
      console.warn("[SIGNUP] User already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    console.log("[SIGNUP] Hashing password...");
    const hashed = await bcrypt.hash(password, 10);

    console.log("[SIGNUP] Creating user in DB:", { name, email, role });
    const user = await User.create({ name, email, password: hashed, role });
    console.log("[SIGNUP] User created successfully:", user._id, user.email);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedPG: user.assignedPG,
      assignedRoom: user.assignedRoom,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("[SIGNUP] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  console.log("[LOGIN] Request received for email:", req.body.email);
  const { email, password } = req.body;
  try {
    console.log("[LOGIN] Looking up user in DB:", email);
    const user = await User.findOne({ email })
      .populate("assignedPG", "name address city")
      .populate("assignedRoom", "roomNumber rent");

    if (!user) {
      console.warn("[LOGIN] No user found with email:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("[LOGIN] User found:", user._id, "| Role:", user.role);

    console.log("[LOGIN] Comparing password...");
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.warn("[LOGIN] Password mismatch for:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    console.log("[LOGIN] Password match — login successful for:", email);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      assignedPG: user.assignedPG,
      assignedRoom: user.assignedRoom,
      token: generateToken(user._id),
    });
  } catch (err) {
    console.error("[LOGIN] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const getMe = async (req, res) => {
  console.log("[GET ME] Fetching profile for user:", req.user._id, req.user.email);
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("assignedPG", "name address city amenities")
      .populate("assignedRoom", "roomNumber rent capacity occupancy");
    console.log("[GET ME] Profile fetched:", user.email, "| AssignedPG:", user.assignedPG?.name || "None");
    res.json(user);
  } catch (err) {
    console.error("[GET ME] ERROR:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login, getMe };