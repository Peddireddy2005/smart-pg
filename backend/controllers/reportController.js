const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const PG = require("../models/PG");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const asyncHandler = require("../utils/asyncHandler");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Builds the owner's summary dataset shared by both PDF and Excel exports
// (spec §17 Reports: revenue, occupancy, payments, complaints, residents, rooms).
const buildReportData = async (ownerId, month, year) => {
  const pgs = await PG.find({ owner: ownerId });
  const pgIds = pgs.map((p) => p._id);
  const rooms = await Room.find({ pg: { $in: pgIds } }).populate("pg", "name");
  const payments = await Payment.find({ pg: { $in: pgIds }, month, year }).populate("resident", "name email").populate("room", "roomNumber").populate("pg", "name");
  const complaints = await Complaint.find({ pg: { $in: pgIds } }).populate("resident", "name").populate("pg", "name");
  const residents = await User.find({ role: "resident", assignedPG: { $in: pgIds } }).select("name email phone assignedPG assignedRoom");

  const totalCollected = payments.filter((p) => p.status === "paid").reduce((s, p) => s + p.amount, 0);
  const totalPending = payments.filter((p) => p.status === "pending").reduce((s, p) => s + p.amount, 0);
  const totalCapacity = rooms.reduce((s, r) => s + r.capacity, 0);
  const totalOccupied = rooms.reduce((s, r) => s + r.occupancy, 0);
  const occupancyPct = totalCapacity ? Math.round((totalOccupied / totalCapacity) * 100) : 0;

  return { pgs, rooms, payments, complaints, residents, totalCollected, totalPending, occupancyPct, month, year };
};

const getReportSummary = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const data = await buildReportData(req.user._id, month, year);
  res.json({
    month: MONTHS[month - 1], year,
    totalPGs: data.pgs.length, totalRooms: data.rooms.length, totalResidents: data.residents.length,
    totalCollected: data.totalCollected, totalPending: data.totalPending, occupancyPct: data.occupancyPct,
    openComplaints: data.complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").length,
    totalComplaints: data.complaints.length,
  });
});

const downloadReportPDF = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const data = await buildReportData(req.user._id, month, year);

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=smart-pg-report-${MONTHS[month - 1]}-${year}.pdf`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).fillColor("#ff7a09").text("Smart PG — Monthly Report");
  doc.fontSize(11).fillColor("#000").text(`${MONTHS[month - 1]} ${year}`).moveDown(1);

  doc.fontSize(13).text("Overview", { underline: true }).moveDown(0.3);
  doc.fontSize(10);
  doc.text(`PGs: ${data.pgs.length}    Rooms: ${data.rooms.length}    Residents: ${data.residents.length}`);
  doc.text(`Occupancy: ${data.occupancyPct}%`);
  doc.text(`Collected: Rs. ${data.totalCollected.toLocaleString()}    Pending: Rs. ${data.totalPending.toLocaleString()}`);
  doc.text(`Complaints: ${data.complaints.length} total, ${data.complaints.filter((c) => c.status !== "resolved" && c.status !== "closed").length} open`);
  doc.moveDown(1);

  doc.fontSize(13).text("Payments", { underline: true }).moveDown(0.3);
  doc.fontSize(9);
  data.payments.forEach((p) => {
    doc.text(`${p.resident?.name || "-"} | Room ${p.room?.roomNumber || "-"} | Rs. ${p.amount} | ${p.status}`);
  });
  if (data.payments.length === 0) doc.text("No payment records for this period.");

  doc.end();
});

const downloadReportExcel = asyncHandler(async (req, res) => {
  const now = new Date();
  const month = Number(req.query.month) || now.getMonth() + 1;
  const year = Number(req.query.year) || now.getFullYear();
  const data = await buildReportData(req.user._id, month, year);

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Smart PG";

  const overview = workbook.addWorksheet("Overview");
  overview.columns = [{ header: "Metric", key: "metric", width: 30 }, { header: "Value", key: "value", width: 20 }];
  overview.addRows([
    { metric: "Period", value: `${MONTHS[month - 1]} ${year}` },
    { metric: "Total PGs", value: data.pgs.length },
    { metric: "Total Rooms", value: data.rooms.length },
    { metric: "Total Residents", value: data.residents.length },
    { metric: "Occupancy %", value: data.occupancyPct },
    { metric: "Rent Collected", value: data.totalCollected },
    { metric: "Rent Pending", value: data.totalPending },
    { metric: "Total Complaints", value: data.complaints.length },
  ]);

  const paymentsSheet = workbook.addWorksheet("Payments");
  paymentsSheet.columns = [
    { header: "Resident", key: "resident", width: 25 },
    { header: "PG", key: "pg", width: 20 },
    { header: "Room", key: "room", width: 10 },
    { header: "Amount", key: "amount", width: 12 },
    { header: "Status", key: "status", width: 12 },
    { header: "Method", key: "method", width: 15 },
  ];
  data.payments.forEach((p) => paymentsSheet.addRow({
    resident: p.resident?.name || "-", pg: p.pg?.name || "-", room: p.room?.roomNumber || "-",
    amount: p.amount, status: p.status, method: p.paymentMethod || "-",
  }));

  const residentsSheet = workbook.addWorksheet("Residents");
  residentsSheet.columns = [
    { header: "Name", key: "name", width: 25 },
    { header: "Email", key: "email", width: 30 },
    { header: "Phone", key: "phone", width: 18 },
  ];
  data.residents.forEach((r) => residentsSheet.addRow({ name: r.name, email: r.email, phone: r.phone || "-" }));

  const complaintsSheet = workbook.addWorksheet("Complaints");
  complaintsSheet.columns = [
    { header: "Title", key: "title", width: 30 },
    { header: "Resident", key: "resident", width: 22 },
    { header: "Status", key: "status", width: 15 },
    { header: "Priority", key: "priority", width: 12 },
  ];
  data.complaints.forEach((c) => complaintsSheet.addRow({ title: c.title, resident: c.resident?.name || "-", status: c.status, priority: c.priority }));

  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=smart-pg-report-${MONTHS[month - 1]}-${year}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = { getReportSummary, downloadReportPDF, downloadReportExcel };
