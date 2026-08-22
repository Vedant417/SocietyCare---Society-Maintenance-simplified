const SystemSetting = require("../models/SystemSetting");

async function getSettings(req, res, next) {
  try {
    const settings = await SystemSetting.find().lean();
    const settingsMap = {};
    settings.forEach((s) => { settingsMap[s.key] = s.value; });

    if (!settingsMap["complaint_overdue_days"]) {
      settingsMap["complaint_overdue_days"] = process.env.OVERDUE_DAYS || "3";
    }

    return res.status(200).json({ success: true, data: settingsMap });
  } catch (error) { next(error); }
}

async function updateSettings(req, res, next) {
  try {
    const { complaint_overdue_days } = req.body;
    if (complaint_overdue_days === undefined) {
      return res.status(400).json({ success: false, message: "complaint_overdue_days is required" });
    }

    const setting = await SystemSetting.findOneAndUpdate(
      { key: "complaint_overdue_days" },
      { value: String(complaint_overdue_days) },
      { upsert: true, new: true }
    );

    return res.status(200).json({ success: true, message: "System settings updated successfully!", data: { [setting.key]: setting.value } });
  } catch (error) { next(error); }
}

module.exports = { getSettings, updateSettings };
