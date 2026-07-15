const cron = require("node-cron");
const PG = require("../models/PG");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const logger = require("../config/logger");
const { notify } = require("./notify");
const { sendEmail, templates } = require("./sendEmail");

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

const generateRentsForAllPGs = async () => {
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  logger.info(`[CRON] Auto-generating rent for ${month}/${year}`);

  const pgs = await PG.find({ isActive: true });
  let created = 0;

  for (const pg of pgs) {
    const rooms = await Room.find({ pg: pg._id }).populate("residents");
    for (const room of rooms) {
      for (const resident of room.residents) {
        const exists = await Payment.findOne({ resident: resident._id, room: room._id, month, year });
        if (!exists) {
          const payment = await Payment.create({
            resident: resident._id, room: room._id, pg: pg._id,
            amount: room.rent, month, year, dueDate: new Date(year, month - 1, 5),
          });
          created += 1;
          await notify({
            user: resident._id,
            title: "Rent Due",
            message: `Your rent of ₹${room.rent.toLocaleString()} for ${MONTHS[month - 1]} ${year} is due.`,
            type: "payment",
            link: "/resident/payments",
          });
        }
      }
    }
  }
  logger.info(`[CRON] Auto-generated ${created} rent records`);
};

const sendDueReminders = async () => {
  logger.info("[CRON] Sending rent due reminders");
  const now = new Date();
  const pending = await Payment.find({
    status: "pending", month: now.getMonth() + 1, year: now.getFullYear(),
  }).populate("resident", "name email");

  for (const p of pending) {
    if (!p.resident?.email) continue;
    await sendEmail({
      to: p.resident.email,
      subject: "Rent Due Reminder — Smart PG",
      html: templates.paymentDue(p.resident.name, p.amount, MONTHS[p.month - 1], p.year),
    });
  }
  logger.info(`[CRON] Sent ${pending.length} reminder emails`);
};

const initCronJobs = () => {
  // 1st of every month at 6 AM — create rent records for all active residents.
  cron.schedule("0 6 1 * *", () => generateRentsForAllPGs().catch((e) => logger.error(`[CRON] ${e.message}`)));

  // Every day at 9 AM — remind anyone with pending rent this month.
  cron.schedule("0 9 * * *", () => sendDueReminders().catch((e) => logger.error(`[CRON] ${e.message}`)));

  logger.info("[CRON] Scheduled jobs initialized");
};

module.exports = { initCronJobs, generateRentsForAllPGs, sendDueReminders };
