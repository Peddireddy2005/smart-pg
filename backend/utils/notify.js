const Notification = require("../models/Notification");
const logger = require("../config/logger");

const notify = async ({ user, title, message, type = "system", link = "" }) => {
  try {
    await Notification.create({ user, title, message, type, link });
  } catch (err) {
    logger.warn(`[NOTIFY] Failed to create notification for ${user}: ${err.message}`);
  }
};

const notifyMany = async (userIds, payload) => {
  await Promise.all(userIds.map((user) => notify({ ...payload, user })));
};

module.exports = { notify, notifyMany };
