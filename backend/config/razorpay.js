const Razorpay = require("razorpay");
const logger = require("./logger");

const isConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);

let instance = null;

const getRazorpay = () => {
  if (!isConfigured()) {
    throw new Error(
      "Payment gateway is not configured on the server. Set RAZORPAY_KEY_ID / RAZORPAY_KEY_SECRET."
    );
  }
  if (!instance) {
    instance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
    logger.info("[RAZORPAY] Client initialized");
  }
  return instance;
};

module.exports = { getRazorpay, isConfigured };
