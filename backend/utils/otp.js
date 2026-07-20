const crypto = require("crypto");
const Otp = require("../models/Otp");
const logger = require("../config/logger");

const OTP_EXPIRE_MIN = Number(process.env.OTP_EXPIRE_MIN) || 5;

const generateOtp = async (email, purpose = "verify-email") => {
  const code = String(crypto.randomInt(100000, 999999));
  const expiresAt = new Date(Date.now() + OTP_EXPIRE_MIN * 60 * 1000);
  await Otp.create({ email: email.toLowerCase(), code, purpose, expiresAt });

  logger.info(`[OTP] ${email} (${purpose}) code generated — expires in ${OTP_EXPIRE_MIN}m`);
  return { code, expiresAt };
};

const verifyOtp = async (email, code, purpose = "verify-email") => {
  const record = await Otp.findOne({ email: email.toLowerCase(), code, purpose, consumed: false }).sort({ createdAt: -1 });
  if (!record) return false;
  if (record.expiresAt < new Date()) return false;
  record.consumed = true;
  await record.save();
  return true;
};

module.exports = { generateOtp, verifyOtp };
