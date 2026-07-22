// Downscales + re-encodes an image in-browser before upload. Cuts typical
// phone-camera photos (3-8MB) down to a few hundred KB without a visible
// quality loss, which speeds up uploads a lot on mobile connections.
export const compressImage = (file, { maxWidth = 1600, maxHeight = 1600, quality = 0.8 } = {}) =>
  new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/") || file.type === "image/svg+xml") {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => { img.src = e.target.result; };
    reader.onerror = () => reject(new Error("Failed to read file"));

    img.onload = () => {
      let { width, height } = img;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }

      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) { resolve(file); return; }
          // Skip if compression didn't actually help (e.g. already small/simple image).
          if (blob.size >= file.size) { resolve(file); return; }
          resolve(new File([blob], file.name, { type: "image/jpeg", lastModified: Date.now() }));
        },
        "image/jpeg",
        quality
      );
    };
    img.onerror = () => resolve(file); // fall back to original on any decode error

    reader.readAsDataURL(file);
  });