const Notification = require("../models/Notification");
const logger = require("../config/logger");

/**
 * Creates an in-app notification for a user. Never throws — a failed
 * notification write should never break the primary action that triggered
 * it (payment recorded, complaint filed, resident allocated, etc.).
 *
 * NOTE: This file previously (and incorrectly) contained a copy of
 * utils/generateToken.js, which meant every call site doing
 * `const { notify } = require("../utils/notify")` was destructuring
 * `undefined` and would throw "notify is not a function" as soon as it ran.
 * That silently broke rent-due alerts, payment-received/approved/rejected
 * alerts, complaint alerts, resident-allocation alerts, announcement
 * broadcasts, and vacate-notice alerts. This restores the actual
 * notification utility that notificationController.js / Notification.js
 * expect.
 */
const notify = async ({ user, title, message, type = "system", link = "" }) => {
  if (!user) {
    logger.warn("[NOTIFY] Skipped — no user provided");
    return;
  }
  try {
    await Notification.create({ user, title, message, type, link });
  } catch (err) {
    logger.warn(`[NOTIFY] Failed to create notification for ${user}: ${err.message}`);
  }
};

module.exports = { notify };