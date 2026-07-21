const mongoose = require("mongoose");
const crypto = require("crypto");

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
    idProofNumber: { type: String, default: "" },

    photoUrl: { type: String, default: "" },
    idProofUrl: { type: String, default: "" },
    rentalAgreementUrl: { type: String, default: "" },
    policeVerificationUrl: { type: String, default: "" },

    // Owner-only business profile fields
    businessName: { type: String, default: "" },
    logoUrl: { type: String, default: "" },
    upiId: { type: String, default: "" },
    bankDetails: { type: String, default: "" },
    gstNumber: { type: String, default: "" },

    // Owner payment settings (spec: "Owner Payment Settings" — which
    // methods residents are allowed to use to pay this owner).
    paymentMethodsEnabled: {
      razorpay: { type: Boolean, default: true },
      upi: { type: Boolean, default: true },
      cash: { type: Boolean, default: true },
    },

    // Preferences
    theme: { type: String, enum: ["light", "dark"], default: "light" },

    occupation: { type: String, default: "" },
    college: { type: String, default: "" },
    company: { type: String, default: "" },

    assignedPG: { type: mongoose.Schema.Types.ObjectId, ref: "PG", default: null },
    assignedRoom: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },
    moveInDate: { type: Date },
    moveOutDate: { type: Date },

    // History preserved after a resident vacates — the owner "Vacate" action
    // clears assignedPG/assignedRoom but keeps these so the resident's past
    // stay isn't lost and can be shown in a "Vacated Residents" list.
    lastPG: { type: mongoose.Schema.Types.ObjectId, ref: "PG", default: null },
    lastRoom: { type: mongoose.Schema.Types.ObjectId, ref: "Room", default: null },

    // Resident-submitted notice that they intend to move out. Must be given
    // at least 30 days ahead of the planned date. Cleared once the owner
    // processes the vacate, or if the resident cancels it themselves.
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