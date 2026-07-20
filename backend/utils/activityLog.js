const ActivityLog = require("../models/ActivityLog");
const logger = require("../config/logger");

/**
 * Records an audit-trail entry scoped to an owner's account. Never throws —
 * a failed log write should never break the primary action.
 */
const logActivity = async ({ owner, actor, action, entityType = "", entityId = null, details = "" }) => {
  try {
    await ActivityLog.create({ owner, actor, action, entityType, entityId, details });
  } catch (err) {
    logger.warn(`[ACTIVITY LOG] Failed: ${err.message}`);
  }
};

module.exports = { logActivity };
