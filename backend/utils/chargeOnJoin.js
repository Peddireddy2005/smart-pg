const Payment = require("../models/Payment");
const { notify } = require("./notify");
const { logActivity } = require("./activityLog");
const logger = require("../config/logger");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/**
 * Charges a resident the moment they join a room — a prorated rent payment
 * for the remainder of the current month, plus a one-time security deposit
 * if the room has one configured.
 *
 * Called from all three join paths: owner allocation, invite-link claim,
 * and QR/code claim.
 *
 * Idempotent: safe to call more than once for the same resident/room — it
 * will never create a second rent record for the same month, or a second
 * deposit record for the same resident/room.
 */
const chargeResidentOnJoin = async ({ resident, room, pg, ownerId }) => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const daysInMonth = new Date(year, month, 0).getDate();
  const dayOfMonth = now.getDate();
  const daysRemaining = daysInMonth - dayOfMonth + 1; // include today
  const isProrated = dayOfMonth > 1;
  const proratedAmount = isProrated
    ? Math.round((room.rent / daysInMonth) * daysRemaining)
    : room.rent;

  const pgId = pg._id || pg;
  const ownerObjId = ownerId || pg.owner;

  // --- Rent for the current month (skip if one already exists) ---
  const existingRent = await Payment.findOne({
    resident: resident._id,
    room: room._id,
    month,
    year,
    type: "rent",
  });

  if (!existingRent) {
    const dueDate = new Date(year, month - 1, Math.min(dayOfMonth + 5, daysInMonth));
    const rentPayment = await Payment.create({
      resident: resident._id,
      room: room._id,
      pg: pgId,
      amount: proratedAmount,
      month,
      year,
      dueDate,
      type: "rent",
      note: isProrated
        ? `Prorated for ${daysRemaining} of ${daysInMonth} days in ${MONTHS[month - 1]}`
        : "",
    });

    await notify({
      user: resident._id,
      title: "Rent Due",
      message: `Your ${isProrated ? "prorated " : ""}rent of ₹${proratedAmount.toLocaleString()} for ${MONTHS[month - 1]} ${year} is due.`,
      type: "payment",
      link: "/resident/payments",
    });

    await logActivity({
      owner: ownerObjId,
      actor: ownerObjId,
      action: "Rent Charged On Join",
      entityType: "Payment",
      entityId: rentPayment._id,
      details: `${resident.email} — ₹${proratedAmount} for ${MONTHS[month - 1]} ${year}${isProrated ? " (prorated)" : ""}`,
    });

    logger.info(`[CHARGE ON JOIN] Rent created for ${resident.email}: ₹${proratedAmount}`);
  }

  // --- One-time security deposit (skip if this resident/room already has one) ---
  if (room.depositAmount > 0) {
    const existingDeposit = await Payment.findOne({
      resident: resident._id,
      room: room._id,
      type: "deposit",
    });

    if (!existingDeposit) {
      const depositPayment = await Payment.create({
        resident: resident._id,
        room: room._id,
        pg: pgId,
        amount: room.depositAmount,
        month,
        year,
        dueDate: now,
        type: "deposit",
        note: "One-time security deposit",
      });

      await notify({
        user: resident._id,
        title: "Security Deposit Due",
        message: `A one-time security deposit of ₹${room.depositAmount.toLocaleString()} is due for Room ${room.roomNumber}.`,
        type: "payment",
        link: "/resident/payments",
      });

      await logActivity({
        owner: ownerObjId,
        actor: ownerObjId,
        action: "Deposit Charged On Join",
        entityType: "Payment",
        entityId: depositPayment._id,
        details: `${resident.email} — ₹${room.depositAmount} deposit`,
      });

      logger.info(`[CHARGE ON JOIN] Deposit created for ${resident.email}: ₹${room.depositAmount}`);
    }
  }
};

module.exports = { chargeResidentOnJoin };