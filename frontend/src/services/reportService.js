import api from "./api";

export const getReportSummary = (month, year) =>
  api.get("/reports/summary", { params: { month, year } }).then((r) => r.data);

const downloadBlob = async (url, filename) => {
  const response = await api.get(url, { responseType: "blob" });
  const blobUrl = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement("a");
  link.href = blobUrl;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const downloadReportPDF = (month, year) =>
  downloadBlob(`/reports/pdf?month=${month}&year=${year}`, `smart-pg-report-${month}-${year}.pdf`);

export const downloadReportExcel = (month, year) =>
  downloadBlob(`/reports/excel?month=${month}&year=${year}`, `smart-pg-report-${month}-${year}.xlsx`);
