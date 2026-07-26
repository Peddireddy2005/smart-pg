const crypto = require("crypto");
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const generateToken = require("../utils/generateToken");
const { issueRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllForUser } = require("../utils/refreshToken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { verifyGoogleToken, isConfigured: googleConfigured } = require("../config/googleOAuth");
const logger = require("../config/logger");

const formatUser = (user, token, refreshToken) => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  emergencyContact: user.emergencyContact,
  emergencyPhone: user.emergencyPhone,
  idProofType: user.idProofType,
  idProofNumber: user.idProofNumber,
  photoUrl: user.photoUrl,
  idProofUrl: user.idProofUrl,
  rentalAgreementUrl: user.rentalAgreementUrl,
  policeVerificationUrl: user.policeVerificationUrl,
  businessName: user.businessName,
  logoUrl: user.logoUrl,
  upiId: user.upiId,
  bankDetails: user.bankDetails,
  gstNumber: user.gstNumber,
  theme: user.theme,
  assignedPG: user.assignedPG,
  assignedRoom: user.assignedRoom,
  isVerified: user.isVerified,
  token,
  refreshToken,
});

// Issues a short-lived access token + long-lived refresh token for a
// freshly authenticated user. Shared by every login-equivalent flow below.
const issueSession = async (user) => {
  const refreshToken = await issueRefreshToken(user._id);
  return formatUser(user, generateToken(user._id), refreshToken);
};

// No SMTP available in this build, so accounts are verified immediately on
// signup instead of via an emailed OTP code.
const signup = asyncHandler(async (req, res) => {
  const { name, email, password, role } = req.body;
  logger.info(`[SIGNUP] Attempt: ${email} ${role}`);

  const exists = await User.findOne({ email: email.toLowerCase() });
  if (exists) {
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
      return res.status(201).json(await issueSession(populated));
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

  res.status(201).json(await issueSession(user));
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
  res.json(await issueSession(user));
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
    "rentalAgreementUrl", "policeVerificationUrl",
    "businessName", "logoUrl", "upiId", "bankDetails", "gstNumber",
    "occupation", "college", "company", "theme",
  ];
  const updates = {};
  allowed.forEach((field) => {
    if (req.body[field] !== undefined) updates[field] = req.body[field];
  });

  // runSetters ensures the idProofNumber encryption setter actually runs on
  // this update path — findByIdAndUpdate skips custom setters by default.
  const user = await User.findByIdAndUpdate(req.user._id, updates, { new: true, runValidators: true, runSetters: true })
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
  // A changed password should invalidate any refresh tokens issued before
  // the change — force re-login on every other device/session.
  await revokeAllForUser(user._id);
  logger.info(`[CHANGE PASSWORD] Updated for ${user.email}`);
  res.json({ message: "Password updated successfully" });
});

// No email delivery available — the reset link is returned directly in the
// response instead of being emailed. The frontend displays/copies it.
const forgotPassword = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const user = await User.findOne({ email: email.toLowerCase() });

  if (!user) {
    return res.json({ message: "If that email exists, a reset link has been generated.", resetUrl: null });
  }

  const resetToken = user.createResetToken();
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:5173"}/reset-password/${resetToken}`;

  logger.info(`[FORGOT PASSWORD] Reset link generated for ${user.email}`);
  res.json({ message: "Reset link generated.", resetUrl });
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
  await revokeAllForUser(user._id);

  logger.info(`[RESET PASSWORD] Password reset for ${user.email}`);
  res.json({ message: "Password reset successful. You can now log in." });
});

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
  }

  res.json(await issueSession(user));
});

// Exchanges a valid, unexpired refresh token for a new access token,
// rotating the refresh token in the process.
const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  const result = await rotateRefreshToken(refreshToken);
  if (!result) throw new AppError("Invalid or expired refresh token, please log in again", 401);

  res.json({ token: generateToken(result.userId), refreshToken: result.token });
});

// Best-effort — always returns success even if the token was already
// invalid, since the end state (no valid session) is the same either way.
const logout = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (refreshToken) await revokeRefreshToken(refreshToken);
  res.json({ message: "Logged out" });
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
  refreshAccessToken,
  logout,
};