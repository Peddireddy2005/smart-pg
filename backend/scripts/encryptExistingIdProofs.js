/**
 * One-time migration: encrypts any idProofNumber values saved before
 * encryption-at-rest was added. Safe to re-run — already-encrypted values
 * (prefixed "enc:") are left untouched.
 *
 * Usage: npm run migrate:encrypt-id-proofs
 * Requires ENCRYPTION_KEY to be set.
 */
const dotenv = require("dotenv");
const mongoose = require("mongoose");
dotenv.config();

const { encrypt } = require("../utils/encryption");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  // Read the raw collection directly — bypasses the schema getter/setter so
  // we see the actual stored value, not a decrypted one.
  const users = await mongoose.connection.collection("users")
    .find({ idProofNumber: { $exists: true, $ne: "" } })
    .toArray();

  let migrated = 0;
  for (const user of users) {
    if (typeof user.idProofNumber === "string" && !user.idProofNumber.startsWith("enc:")) {
      await mongoose.connection.collection("users").updateOne(
        { _id: user._id },
        { $set: { idProofNumber: encrypt(user.idProofNumber) } }
      );
      migrated += 1;
    }
  }

  console.log(`Migration complete. Encrypted ${migrated} of ${users.length} idProofNumber value(s).`);
  await mongoose.disconnect();
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});