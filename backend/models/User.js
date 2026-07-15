const mongoose = require("mongoose");
const crypto = require("crypto");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: function () {
        // Password is only mandatory for locally-registered accounts.
        // OAuth accounts (Google) authenticate via the provider instead.
        return this.authProvider === "local";
      },
    },
    role: { type: String, enum: ["owner", "resident"], default: "resident" },

    // Auth provider tracking — supports linking a Google sign-in to an
    // account that may have also been created with a normal password.
    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: "", index: true },

    // Profile fields (resident)
    phone: { type: String, default: "" },
    emergencyContact: { type: String, default: "" },
    emergencyPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    idProofType: { type: String, enum: ["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID", ""], default: "" },
    idProofNumber: { type: String, default: "" },

    // Image URLs (stored on Cloudinary, not base64 — keeps documents small and fast)
    photoUrl: { type: String, default: "" },
    idProofUrl: { type: String, default: "" },

    // Assignment (resident only)
    assignedPG: { type: mongoose.Schema.Types.ObjectId, ref: "PG", default: null },
    assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },

    // For unregistered/invited residents
    isVerified: { type: Boolean, default: false },
    invitedByOwner: { type: Boolean, default: false },

    // Password reset
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

userSchema.index({ assignedPG: 1 });
userSchema.index({ role: 1 });

userSchema.methods.createResetToken = function () {
  const resetToken = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = crypto.createHash("sha256").update(resetToken).digest("hex");
  this.resetPasswordExpire = Date.now() + (Number(process.env.RESET_PASSWORD_EXPIRE_MIN) || 30) * 60 * 1000;
  return resetToken;
};

module.exports = mongoose.model("User", userSchema);
