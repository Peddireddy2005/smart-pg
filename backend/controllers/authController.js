const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { sendEmail, templates } = require("../utils/sendEmail");
const { verifyGoogleToken, isConfigured: googleConfigured } = require("../config/googleOAuth");
const logger = require("../config/logger");

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

const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  logger.info(`[SIGNUP] Attempt: ${email} ${role}`);

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
      logger.info(`[SIGNUP] Invited resident account activated: ${email}`);
      const populated = await User.findById(exists._id)
        .populate("assignedPG", "name address city")
        .populate("assignedRoom", "roomNumber rent");
      return res.status(201).json(formatUser(populated));
    }
    throw new AppError("User already exists", 400);
  }

  const hashed = await bcrypt.hash(password, 10);
  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password: hashed,
    role,
    isVerified: true,
  });
  logger.info(`[SIGNUP] User created: ${user._id} ${email}`);

  sendEmail({ to: user.email, subject: "Welcome to Smart PG", html: templates.welcome(user.name) });

  res.status(201).json(formatUser(user));
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  logger.info(`[LOGIN] Attempt: ${email}`);

  const user = await User.findOne({ email: email.toLowerCase() })
    .populate("assignedPG", "name address city")
    .populate("assignedRoom", "roomNumber rent capacity occupancy");

  if (!user) throw new AppError("Invalid credentials", 400);
  if (!user.isActive) throw new AppError("This account has been deactivated", 403);
  if (!user.password) throw new AppError("Please sign up first to set your password", 400);

  const match = await bcrypt.compare(password, user.password);
  if (!match) throw new AppError("Invalid credentials", 400);

  logger.info(`[LOGIN] Success: ${email} ${user.role}`);
  res.json(formatUser(user));
});

const getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)
    .select("-password")
    .populate("assignedPG", "name address city amenities contactPhone rules")
    .populate("assignedRoom", "roomNumber rent capacity occupancy floor type");
  res.json(user);
});

const updateProfile = asyncHandler(async (req, res) => {
  const allowed = [
    "name", "phone", "emergencyContact", "emergencyPhone", "address",
    "idProofType", "idProofNumber", "photoUrl", "idProofUrl",
  ];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true })
    .select("-password")
    .populate("assignedPG", "name address city")
    .populate("assignedRoom", "roomNumber rent");

  logger.info(`[UPDATE PROFILE] Updated: ${req.user.email}`);
  res.json(user);
});

const changePassword = asyncHandler(async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user._id);

  const match = await bcrypt.compare(currentPassword, user.password);
  if (!match) throw new AppError("Current password is incorrect", 400);

  user.password = await bcrypt.hash(newPassword, 10);
  await user.save();
  logger.info(`[CHANGE PASSWORD] Updated for ${user.email}`);
  res.json({ message: "Password updated successfully" });
});

const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  // Always respond the same way to avoid leaking which emails are registered.
  const genericResponse = { message: "If that email exists, a reset link has been sent." };
  if (!user) return res.json(genericResponse);

  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;
  await sendEmail({
    to: user.email,
    subject: "Reset your Smart PG password",
    html: templates.resetPassword(user.name, resetUrl),
  });

  logger.info(`[FORGOT PASSWORD] Reset link generated for ${user.email}`);
  res.json(genericResponse);
});

const resetPassword = asyncHandler(async (req, res) => {
  const hashedToken = crypto.createHash("sha256").update(req.params.token).digest("hex");

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpire: { $gt: Date.now() },
  }).select("+resetPasswordToken +resetPasswordExpire");

  if (!user) throw new AppError("Reset link is invalid or has expired", 400);

  user.password = await bcrypt.hash(req.body.password, 10);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;
  await user.save();

  logger.info(`[RESET PASSWORD] Password reset for ${user.email}`);
  res.json({ message: "Password reset successful. You can now log in." });
});

// --- Google OAuth (Sign in with Google) ------------------------------------
// The frontend uses Google Identity Services to obtain a signed ID token
// (credential) directly from Google — we never see the user's Google
// password. We verify that token server-side, then issue our own JWT exactly
// like a normal login, so the rest of the app doesn't need to know the
// difference between auth providers.
const googleAuth = asyncHandler(async (req, res) => {
  if (!googleConfigured()) {
    throw new AppError("Google sign-in is not configured on the server", 503);
  }

  const { credential, role } = req.body;
  if (!credential) throw new AppError("Missing Google credential", 400);

  let payload;
  try {
    payload = await verifyGoogleToken(credential);
  } catch (err) {
    logger.warn(`[GOOGLE AUTH] Token verification failed: ${err.message}`);
    throw new AppError("Google sign-in failed — invalid or expired token", 401);
  }

  if (!payload?.email_verified) {
    throw new AppError("Your Google email is not verified", 401);
  }

  const email = payload.email.toLowerCase();
  let user = await User.findOne({ email })
    .populate("assignedPG", "name address city")
    .populate("assignedRoom", "roomNumber rent capacity occupancy");

  if (user) {
    if (!user.isActive) throw new AppError("This account has been deactivated", 403);
    // Link the Google identity to an existing (possibly password-based) account.
    if (!user.googleId) {
      user.googleId = payload.sub;
      if (!user.photoUrl && payload.picture) user.photoUrl = payload.picture;
      await user.save();
    }
    logger.info(`[GOOGLE AUTH] Login: ${email}`);
  } else {
    const requestedRole = ["owner", "resident"].includes(role) ? role : "resident";
    user = await User.create({
      name: payload.name || email.split("@")[0],
      email,
      role: requestedRole,
      authProvider: "google",
      googleId: payload.sub,
      photoUrl: payload.picture || "",
      isVerified: true,
    });
    logger.info(`[GOOGLE AUTH] New account created: ${email} (${requestedRole})`);
    sendEmail({ to: user.email, subject: "Welcome to Smart PG", html: templates.welcome(user.name) });
  }

  res.json(formatUser(user));
});

module.exports = {
  signup,
  login,
  googleAuth,
  getMe,
  updateProfile,
  changePassword,
  forgotPassword,
  resetPassword,
};
