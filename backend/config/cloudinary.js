const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const isConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const uploadBuffer = (buffer, folder = "smart-pg") =>
  new Promise((resolve, reject) => {
    if (!isConfigured()) {
      return reject(
        new Error(
          "Image storage is not configured on the server. Set CLOUDINARY_* env vars."
        )
      );
    }
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: "image" },
      (err, result) => {
        if (err) return reject(err);
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });

const deleteImage = async (publicId) => {
  if (!isConfigured() || !publicId) return;
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    require("./logger").warn(`[CLOUDINARY] Failed to delete ${publicId}: ${err.message}`);
  }
};

module.exports = { cloudinary, uploadBuffer, deleteImage, isConfigured };
