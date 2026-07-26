const Sentry = require("@sentry/node");

const isConfigured = () => Boolean(process.env.SENTRY_DSN);

const initSentry = () => {
  if (!isConfigured()) return;
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV || "development",
    tracesSampleRate: Number(process.env.SENTRY_TRACES_SAMPLE_RATE) || 0.1,
  });
};

module.exports = { initSentry, Sentry, isConfigured };