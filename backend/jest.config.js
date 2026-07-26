module.exports = {
  testEnvironment: "node",
  setupFilesAfterEach: undefined,
  setupFilesAfterEnv: ["<rootDir>/tests/setup.js"],
  // Bumped from 20000ms — replica-set-backed transactions in tests are a
  // little slower than plain standalone Mongo writes.
  testTimeout: 30000,
};