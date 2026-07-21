const cron = require("node-cron");
const PG = require("../models/PG");
const Room = require("../models/Room");
const Payment = require("../models/Payment");
const logger = require("../config/logger");
const { notify } = require("./notify");

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
        const exists = await Payment.findOne({ resident: resident._id, room: room._id, month, year, type: "rent" });
        if (!exists) {
          await Payment.create({
            resident: resident._id, room: room._id, pg: pg._id,
            amount: room.rent, month, year, dueDate: new Date(year, month - 1, 5), type: "rent",
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

// Email-based due reminders have been removed (no SMTP available). In-app
// notifications are already sent the moment rent is generated, which covers
// the "reminder" need without email.
const initCronJobs = () => {
  cron.schedule("0 6 1 * *", () => generateRentsForAllPGs().catch((e) => logger.error(`[CRON] ${e.message}`)));
  logger.info("[CRON] Scheduled jobs initialized");
};

module.exports = { initCronJobs, generateRentsForAllPGs };