const crypto = require("crypto");
const RefreshToken = require("../models/RefreshToken");

const REFRESH_TOKEN_DAYS = Number(process.env.REFRESH_TOKEN_EXPIRE_DAYS) || 30;

// Only the SHA-256 hash is ever stored — a leaked database dump doesn't
// hand out usable refresh tokens.
const hashToken = (token) => crypto.createHash("sha256").update(token).digest("hex");

const issueRefreshToken = async (userId) => {
  const token = crypto.randomBytes(40).toString("hex");
  const expiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);
  await RefreshToken.create({ user: userId, tokenHash: hashToken(token), expiresAt });
  return token;
};

// Rotation: validates the presented token, deletes it, and issues a new
// one. Rotating on every use means a stolen-then-replayed token is
// detectable — reuse of an already-rotated token simply fails, since it no
// longer exists in the collection.
const rotateRefreshToken = async (token) => {
  const tokenHash = hashToken(token);
  const existing = await RefreshToken.findOneAndDelete({ tokenHash, expiresAt: { $gt: new Date() } });
  if (!existing) return null;
  const newToken = await issueRefreshToken(existing.user);
  return { userId: existing.user, token: newToken };
};

const revokeRefreshToken = async (token) => {
  if (!token) return;
  await RefreshToken.deleteOne({ tokenHash: hashToken(token) });
};

const revokeAllForUser = async (userId) => {
  await RefreshToken.deleteMany({ user: userId });
};

module.exports = { issueRefreshToken, rotateRefreshToken, revokeRefreshToken, revokeAllForUser };