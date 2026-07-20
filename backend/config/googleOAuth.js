const { OAuth2Client } = require("google-auth-library");

const isConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID);

let client = null;
const getClient = () => {
  if (!client) client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
  return client;
};

const verifyGoogleToken = async (idToken) => {
  const ticket = await getClient().verifyIdToken({
    idToken,
    audience: process.env.GOOGLE_CLIENT_ID,
  });
  return ticket.getPayload();
};

module.exports = { isConfigured, verifyGoogleToken };
