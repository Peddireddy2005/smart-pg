const { OAuth2Client } = require("google-auth-library");

const isConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID);

let client = null;
const getClient = () => {
  if (!client) client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return client;
};

/**
 * Verifies a Google Identity Services credential (ID token) sent from the
 * frontend and returns the verified payload (email, name, picture, sub).
 * Throws if the token is invalid, expired, or issued for a different client.
 */
const verifyGoogleToken = async (idToken) => {
  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

module.exports = { isConfigured, verifyGoogleToken };
