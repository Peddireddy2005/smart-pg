const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["owner", "resident"], default: "resident" },

    // Profile fields (resident)
    phone: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    emergencyPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    idProofType: { type: String, enum: ["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID", ""], default: "" },
    idProofNumber: { type: String, default: "" },

    // Base64 image storage (small images only, <1MB recommended)
    photoUrl: { type: String, default: "" },
    idProofUrl: { type: String, default: "" },

    // Assignment (resident only)
    assignedPG: { type: mongoose.Schema.Types.ObjectId, ref: "PG", default: null },
    assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },

    // For unregistered/invited residents
    isVerified: { type: Boolean, default: false },
    invitedByOwner: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);