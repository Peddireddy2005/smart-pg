import api from "./api";

export const uploadImage = async (file, purpose = "misc") => {
  const formData = new FormData();
  formData.append("image", file);
  formData.append("purpose", purpose);
  const { data } = await api.post("/upload/image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const uploadPGImages = async (pgId, files) => {
  const formData = new FormData();
  files.forEach((f) => formData.append("images", f));
  const { data } = await api.post(`/pg/${pgId}/images`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data;
};

export const deletePGImage = (pgId, imageId) =>
  api.delete(`/pg/${pgId}/images/${imageId}`).then((r) => r.data);
