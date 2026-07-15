const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { uploadBuffer } = require("../config/cloudinary");

// Generic single-image upload — returns a URL the client then saves onto
// whichever record it belongs to (profile photo, ID proof, etc). Keeping
// this generic avoids duplicating upload logic across every feature.
const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No image uploaded", 400);

  const folder = ["profile", "id-proof"].includes(req.body.purpose) ? `smart-pg/${req.body.purpose}` : "smart-pg/misc";
  const { url, publicId } = await uploadBuffer(req.file.buffer, folder);

  res.json({ url, publicId });
});

module.exports = { uploadImage };
