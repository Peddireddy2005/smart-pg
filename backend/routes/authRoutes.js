const express = require("express");
const router = express.Router();
const {
  signup, login, googleAuth, verifyEmail, resendOtp, getMe, updateProfile,
  changePassword, forgotPassword, resetPassword,
} = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { authLimiter, otpLimiter } = require("../middleware/rateLimiter");
const validate = require("../middleware/validate");
const {
  signupValidator, loginValidator, googleAuthValidator, forgotPasswordValidator,
  resetPasswordValidator, changePasswordValidator, verifyEmailValidator, resendOtpValidator,
} = require("../utils/validators");

router.post("/signup", authLimiter, signupValidator, validate, signup);
router.post("/login", authLimiter, loginValidator, validate, login);
router.post("/google", authLimiter, googleAuthValidator, validate, googleAuth);
router.post("/verify-email", otpLimiter, verifyEmailValidator, validate, verifyEmail);
router.post("/resend-otp", otpLimiter, resendOtpValidator, validate, resendOtp);
router.post("/forgot-password", authLimiter, forgotPasswordValidator, validate, forgotPassword);
router.put("/reset-password/:token", authLimiter, resetPasswordValidator, validate, resetPassword);

router.get("/me", protect, getMe);
router.put("/profile", protect, updateProfile);
router.put("/change-password", protect, changePasswordValidator, validate, changePassword);

module.exports = router;
