const QRCode = require("qrcode");
const Visitor = require("../models/Visitor");
const PG = require("../models/PG");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { notify } = require("../utils/notify");
const { logActivity } = require("../utils/activityLog");

// Resident: invite a visitor, generates a QR the visitor / gate can present.
const inviteVisitor = asyncHandler(async (req, res) => {
  const user = req.user;
  if (!user.assignedPG) throw new AppError("You are not assigned to any PG", 400);

  const visitor = await Visitor.create({
    pg: user.assignedPG,
    resident: user._id,
    name: req.body.name,
    phone: req.body.phone,
    purpose: req.body.purpose,
  });

  const qrDataUrl = await QRCode.toDataURL(visitor.qrToken);

  const pg = await PG.findById(user.assignedPG);
  if (pg) {
    await notify({
      user: pg.owner,
      title: "Visitor Invite",
      message: `${user.name} invited a visitor: ${visitor.name}`,
      type: "visitor",
      link: "/owner/visitors",
    });
  }

  res.status(201).json({ ...visitor.toObject(), qrDataUrl });
});

const getMyVisitors = asyncHandler(async (req, res) => {
  const visitors = await Visitor.find({ resident: req.user._id }).sort({ createdAt: -1 });
  res.json(visitors);
});

const getOwnerVisitors = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });
  const visitors = await Visitor.find({ pg: { $in: pgs.map((p) => p._id) } })
    .populate("resident", "name phone")
    .populate("pg", "name")
    .sort({ createdAt: -1 });
  res.json(visitors);
});

// Owner: approve/reject a pending visitor request.
const approveVisitor = asyncHandler(async (req, res) => {
  const { approve } = req.body;
  const visitor = await Visitor.findById(req.params.id).populate("pg").populate("resident", "name");
  if (!visitor) throw new AppError("Visitor not found", 404);
  if (visitor.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  visitor.status = approve ? "approved" : "rejected";
  await visitor.save();

  await notify({
    user: visitor.resident._id,
    title: "Visitor Update",
    message: `Your visitor ${visitor.name} was ${visitor.status}.`,
    type: "visitor",
    link: "/resident/visitors",
  });

  res.json(visitor);
});

// Owner / gate: log entry or exit by scanning the QR token.
const logVisitorEvent = asyncHandler(async (req, res) => {
  const { event } = req.body; // "entry" | "exit"
  const visitor = await Visitor.findOne({ qrToken: req.params.token }).populate("pg");
  if (!visitor) throw new AppError("Invalid visitor QR code", 404);
  if (visitor.pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  if (event === "entry") {
    if (visitor.status !== "approved") throw new AppError("Visitor is not approved for entry", 400);
    visitor.status = "entered";
    visitor.entryTime = new Date();
  } else if (event === "exit") {
    visitor.status = "exited";
    visitor.exitTime = new Date();
  } else {
    throw new AppError("Invalid event", 400);
  }
  await visitor.save();
  await logActivity({ owner: req.user._id, actor: req.user._id, action: `Visitor ${event === "entry" ? "Entered" : "Exited"}`, entityType: "Visitor", entityId: visitor._id, details: visitor.name });

  res.json(visitor);
});

module.exports = { inviteVisitor, getMyVisitors, getOwnerVisitors, approveVisitor, logVisitorEvent };
