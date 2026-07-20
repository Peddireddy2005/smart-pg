const Announcement = require("../models/Announcement");
const PG = require("../models/PG");
const Room = require("../models/Room");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");
const { notify } = require("../utils/notify");
const { sendEmail, templates } = require("../utils/sendEmail");
const { logActivity } = require("../utils/activityLog");

// Owner: broadcast a notice to every resident currently living in the PG.
const createAnnouncement = asyncHandler(async (req, res) => {
  const { pgId } = req.params;
  const { title, message, type } = req.body;

  const pg = await PG.findById(pgId);
  if (!pg) throw new AppError("PG not found", 404);
  if (pg.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);

  const announcement = await Announcement.create({ pg: pgId, owner: req.user._id, title, message, type });

  const rooms = await Room.find({ pg: pgId }).populate("residents", "name email");
  const residents = rooms.flatMap((r) => r.residents);

  await Promise.all(
    residents.map((resident) => {
      notify({
        user: resident._id,
        title: `📢 ${title}`,
        message,
        type: "announcement",
        link: "/resident/announcements",
      });
      return sendEmail({ to: resident.email, subject: `Notice: ${title}`, html: templates.announcement(resident.name, title, message) });
    })
  );

  await logActivity({ owner: req.user._id, actor: req.user._id, action: "Announcement Posted", entityType: "Announcement", entityId: announcement._id, details: title });

  res.status(201).json(announcement);
});

const getPGAnnouncements = asyncHandler(async (req, res) => {
  const announcements = await Announcement.find({ pg: req.params.pgId }).sort({ createdAt: -1 });
  res.json(announcements);
});

// Resident: announcements for their currently-assigned PG.
const getMyAnnouncements = asyncHandler(async (req, res) => {
  if (!req.user.assignedPG) return res.json([]);
  const announcements = await Announcement.find({ pg: req.user.assignedPG }).sort({ createdAt: -1 });
  res.json(announcements);
});

const getOwnerAnnouncements = asyncHandler(async (req, res) => {
  const pgs = await PG.find({ owner: req.user._id });
  const announcements = await Announcement.find({ pg: { $in: pgs.map((p) => p._id) } })
    .populate("pg", "name")
    .sort({ createdAt: -1 });
  res.json(announcements);
});

const deleteAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await Announcement.findById(req.params.id);
  if (!announcement) throw new AppError("Announcement not found", 404);
  if (announcement.owner.toString() !== req.user._id.toString()) throw new AppError("Not authorized", 403);
  await announcement.deleteOne();
  res.json({ message: "Announcement deleted" });
});

module.exports = { createAnnouncement, getPGAnnouncements, getMyAnnouncements, getOwnerAnnouncements, deleteAnnouncement };
