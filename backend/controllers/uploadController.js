const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { uploadBuffer } = require("../config/cloudinary");

const ALLOWED_FOLDERS = ["profile", "id-proof", "documents", "logo", "reviews", "inventory"];

const uploadImage = asyncHandler(async (req, res) => {
  if (!req.file) throw new AppError("No image uploaded", 400);

  const folder = ALLOWED_FOLDERS.includes(req.body.purpose) ? `smart-pg/${req.body.purpose}` : "smart-pg/misc";
  const { url, publicId } = await uploadBuffer(req.file.buffer, folder);

  res.json({ url, publicId });
});

module.exports = { uploadImage };
