const mongoose = require("mongoose");
const crypto = require("crypto");
const { encrypt, decrypt } = require("../utils/encryption");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password: {
      type: String,
      required: function () {
        return this.authProvider === "local";
      },
    },
    role: { type: String, enum: ["owner", "resident", "admin"], default: "resident" },

    authProvider: { type: String, enum: ["local", "google"], default: "local" },
    googleId: { type: String, default: "", index: true },

    // Contact phone number (profile field only — not used for authentication)
    phone: { type: String, default: "", index: true },

    emergencyContact: { type: String, default: "" },
    emergencyPhone: { type: String, default: "" },
    address: { type: String, default: "" },
    idProofType: { type: String, enum: ["Aadhaar", "PAN", "Passport", "Driving License", "Voter ID", ""], default: "" },

    // Encrypted at rest (AES-256-GCM, see utils/encryption.js). The setter
    // encrypts on write, the getter decrypts on read, so the rest of the app
    // keeps treating this as a plain string. Values saved before encryption
    // was added (no "enc:" prefix) still read back correctly as plaintext
    // until migrated — see scripts/encryptExistingIdProofs.js.
    idProofNumber: {
      type: String,
      default: "",
      set: (value) => (value ? encrypt(value) : ""),
      get: (value) => (value ? decrypt(value) : ""),
    },

    photoUrl: { type: String, default: "" },
    idProofUrl: { type: String, default: "" },
    rentalAgreementUrl: { type: String, default: "" },
    policeVerificationUrl: { type: String, default: "" },

    businessName: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    upiId: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
    gstNumber: { type: String, default: "" },

    paymentMethodsEnabled: {
      razorpay: { type: Boolean, default: true },
      upi: { type: Boolean, default: true },
      cash: { type: Boolean, default: true },
    },

    theme: { type: String, enum: ["light", "dark"], default: "light" },

    occupation: { type: String, default: "" },
    college: { type: String, default: "" },
    company: { type: String, default: "" },

    assignedPG: { type: mongoose.Schema.Types.ObjectId, ref: "PG", default: null },
    assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    moveInDate: { type: Date },
    moveOutDate: { type: Date },

    lastPG: { type: mongoose.Schema.Types.ObjectId, ref: "PG", default: null },
    lastRoom: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },

    vacateNotice: {
      requested: { type: Boolean, default: false },
      noticeGivenAt: { type: Date, default: null },
      plannedDate: { type: Date, default: null },
    },

    isVerified: { type: Boolean, default: false },
    invitedByOwner: { type: Boolean, default: false },

    resetPasswordToken: { type: String, select: false },
    resetPasswordExpire: { type: Date, select: false },

    isActive: { type: Boolean, default: true },
  },
  {
    timestamps: true,
    // Custom type getters (idProofNumber decryption) run automatically on
    // direct property access, but toJSON/toObject need this flag explicitly
    // — otherwise res.json(user) would serialize the encrypted string.
    toJSON: { getters: true },
    toObject: { getters: true },
  }
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