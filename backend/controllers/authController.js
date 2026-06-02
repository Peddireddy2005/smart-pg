const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const generateToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });

const formatUser = (user) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  phone: user.phone,
  emergencyContact: user.emergencyContact,
  emergencyPhone: user.emergencyPhone,
  idProofType: user.idProofType,
  idProofNumber: user.idProofNumber,
  photoUrl: user.photoUrl,
  idProofUrl: user.idProofUrl,
  assignedPG: user.assignedPG,
  assignedRoom: user.assignedRoom,
  isVerified: user.isVerified,
  token: generateToken(user._id),
});

const signup = async (req, res) => {
  const { name, email, password, role } = req.body;
  console.log("[SIGNUP] Attempt:", email, role);
  try {
    if (!name || !email || !password) {
      return res.status(400).json({ message: "Name, email and password are required" });
    }

    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      // If this email was pre-created by an owner invite, activate the account
      if (exists.invitedByOwner && !exists.password) {
        const hashed = await bcrypt.hash(password, 10);
        exists.name = name;
        exists.password = hashed;
        exists.role = "resident";
        exists.isVerified = true;
        await exists.save();
        console.log("[SIGNUP] Invited resident account activated:", email);
        const populated = await User.findById(exists._id)
          .populate("assignedPG", "name address city")
          .populate("assignedRoom", "roomNumber rent");
        return res.status(201).json(formatUser(populated));
      }
      console.warn("[SIGNUP] Email already exists:", email);
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: email.toLowerCase(), password: hashed, role, isVerified: true });
    console.log("[SIGNUP] User created:", user._id, email);
    res.status(201).json(formatUser(user));
  } catch (err) {
    console.error("[SIGNUP] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const login = async (req, res) => {
  const { email, password } = req.body;
  console.log("[LOGIN] Attempt:", email);
  try {
    const user = await User.findOne({ email: email.toLowerCase() })
      .populate("assignedPG", "name address city")
      .populate("assignedRoom", "roomNumber rent capacity occupancy");

    if (!user) {
      console.warn("[LOGIN] Not found:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }
    if (!user.password) {
      return res.status(400).json({ message: "Please sign up first to set your password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.warn("[LOGIN] Wrong password:", email);
      return res.status(400).json({ message: "Invalid credentials" });
    }

    console.log("[LOGIN] Success:", email, user.role);
    res.json(formatUser(user));
  } catch (err) {
    console.error("[LOGIN] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const { data } = await api.post("/auth/login", form);

console.log("LOGIN DATA:");
console.log(data);

localStorage.setItem("user", JSON.stringify(data));

const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("assignedPG", "name address city amenities contactPhone rules")
      .populate("assignedRoom", "roomNumber rent capacity occupancy floor type");
    console.log("[GET ME]", user.email);
    res.json(user);
  } catch (err) {
    console.error("[GET ME] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

const updateProfile = async (req, res) => {
  console.log("[UPDATE PROFILE] User:", req.user.email, "| Fields:", Object.keys(req.body));
  try {
    const allowed = ["name", "phone", "emergencyContact", "emergencyPhone", "address",
      "idProofType", "idProofNumber", "photoUrl", "idProofUrl"];
    const updates = {};
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true })
      .select("-password")
      .populate("assignedPG", "name address city")
      .populate("assignedRoom", "roomNumber rent");

    console.log("[UPDATE PROFILE] Updated:", req.user.email);
    res.json(user);
  } catch (err) {
    console.error("[UPDATE PROFILE] Error:", err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { signup, login, getMe, updateProfile };