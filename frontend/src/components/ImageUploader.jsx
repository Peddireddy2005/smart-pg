import { useRef, useState } from "react";
import toast from "react-hot-toast";
import { uploadImage } from "../services/uploadService";
import { compressImage } from "../utils/compressImage";

export default function ImageUploader({
  value,
  onChange,
  purpose = "misc",
  label = "Upload image",
  maxSizeMB = 5,
  round = false,
  className = "",
}) {
  const inputRef = useRef(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`Image must be under ${maxSizeMB}MB`);
      return;
    }
    setLoading(true);
    try {
      const compressed = await compressImage(file);
      const { url } = await uploadImage(compressed, purpose);
      onChange(url);
      toast.success("Image uploaded");
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed");
    } finally {
      setLoading(false);
      e.target.value = "";
    }
  };

  return (
    <div className={className}>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
      {value ? (
        <div className="flex items-center gap-4">
          <img
            src={value}
            alt=""
            className={`object-cover border-2 border-gray-100 dark:border-slate-700 ${round ? "w-20 h-20 rounded-full" : "w-24 h-16 rounded-xl"}`}
          />
          <button type="button" disabled={loading} onClick={() => inputRef.current.click()} className="btn-secondary text-sm">
            {loading ? "Uploading..." : "Change"}
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={loading}
          onClick={() => inputRef.current.click()}
          className="border-2 border-dashed border-gray-300 dark:border-slate-600 rounded-xl px-6 py-4 text-slate-500 dark:text-slate-400 hover:border-brand-400 hover:text-brand-500 transition w-full text-sm"
        >
          {loading ? "Uploading..." : `📎 ${label}`}
        </button>
      )}
    </div>
  );
}