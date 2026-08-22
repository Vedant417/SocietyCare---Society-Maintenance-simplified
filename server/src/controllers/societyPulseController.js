const SocietyPulse = require("../models/SocietyPulse");
const User = require("../models/User");

// Helper to determine overall status
function calculateOverallStatus(pulse) {
  const statuses = [pulse.maintenance, pulse.waterSupply, pulse.power, pulse.commonAreas];
  if (statuses.includes("CRITICAL")) return "CRITICAL";
  if (statuses.includes("WARNING")) return "WARNING";
  return "GOOD";
}

/**
 * Get the current Society Pulse state
 * GET /api/society-pulse
 */
async function getSocietyPulse(req, res, next) {
  try {
    let pulse = await SocietyPulse.findOne()
      .populate("updatedBy", "name role")
      .exec();

    // Initialize if no record exists
    if (!pulse) {
      // Find the first admin to act as default updater
      let defaultUpdater = await User.findOne({ role: "ADMIN" });
      if (!defaultUpdater) {
        defaultUpdater = req.user;
      }

      pulse = await SocietyPulse.create({
        maintenance: "GOOD",
        waterSupply: "NORMAL",
        power: "GOOD",
        commonAreas: "GOOD",
        updatedBy: defaultUpdater._id
      });

      pulse = await SocietyPulse.findById(pulse._id)
        .populate("updatedBy", "name role")
        .exec();
    }

    const overallStatus = calculateOverallStatus(pulse);

    return res.status(200).json({
      success: true,
      data: {
        id: pulse.id,
        maintenance: pulse.maintenance,
        waterSupply: pulse.waterSupply,
        power: pulse.power,
        commonAreas: pulse.commonAreas,
        overallStatus,
        updatedBy: pulse.updatedBy ? (pulse.updatedBy.role === 'ADMIN' ? 'Supervisor' : pulse.updatedBy.name) : 'Supervisor',
        updatedAt: pulse.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update the Society Pulse state (Admin/Secretary only)
 * PATCH /api/society-pulse
 */
async function updateSocietyPulse(req, res, next) {
  try {
    const { maintenance, waterSupply, power, commonAreas } = req.body;
    const userId = req.user.id;

    let pulse = await SocietyPulse.findOne();

    if (!pulse) {
      pulse = new SocietyPulse({ updatedBy: userId });
    }

    if (maintenance) pulse.maintenance = maintenance;
    if (waterSupply) pulse.waterSupply = waterSupply;
    if (power) pulse.power = power;
    if (commonAreas) pulse.commonAreas = commonAreas;
    pulse.updatedBy = userId;

    await pulse.save();

    const populatedPulse = await SocietyPulse.findById(pulse._id)
      .populate("updatedBy", "name role")
      .exec();

    const overallStatus = calculateOverallStatus(populatedPulse);

    return res.status(200).json({
      success: true,
      message: "Society Pulse updated successfully!",
      data: {
        id: populatedPulse.id,
        maintenance: populatedPulse.maintenance,
        waterSupply: populatedPulse.waterSupply,
        power: populatedPulse.power,
        commonAreas: populatedPulse.commonAreas,
        overallStatus,
        updatedBy: populatedPulse.updatedBy ? (populatedPulse.updatedBy.role === 'ADMIN' ? 'Supervisor' : populatedPulse.updatedBy.name) : 'Supervisor',
        updatedAt: populatedPulse.updatedAt
      }
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  getSocietyPulse,
  updateSocietyPulse
};
