const Notice = require("../models/Notice");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { notifyImportantNotice } = require("../services/notificationService");

async function getNotices(req, res, next) {
  try {
    const notices = await Notice.find()
      .populate("authorId", "name role")
      .sort({ isImportant: -1, createdAt: -1 })
      .lean();

    const mapped = notices.map((n) => ({
      ...n,
      id: n._id.toString(),
      authorId: n.authorId?._id?.toString(),
      author: n.authorId ? { name: n.authorId.name, role: n.authorId.role } : null,
    }));

    return res.status(200).json({ success: true, data: mapped });
  } catch (error) { next(error); }
}

async function createNotice(req, res, next) {
  try {
    const { title, content, isImportant } = req.body;
    const authorId = req.user.id;

    const notice = await Notice.create({ title, content, isImportant: !!isImportant, authorId });

    // Notify all residents
    try {
      const residents = await User.find({ role: "RESIDENT" });
      const { sendRealTimeNotification } = require("../config/socket");
      for (const resident of residents) {
        if (resident._id.toString() === authorId) continue;
        const newNotification = await Notification.create({
          userId: resident._id,
          type: "NOTICE_POSTED",
          message: `New Notice: ${notice.title}`,
        });
        sendRealTimeNotification(resident._id.toString(), newNotification.toJSON());
      }
    } catch (notifError) {
      console.error("Failed to send notice notifications:", notifError.message);
    }

    // Email important notices
    if (notice.isImportant) {
      const residents = await User.find({ role: "RESIDENT" }).select("name email");
      residents.forEach((resident) => {
        if (resident.email) {
          notifyImportantNotice({
            residentEmail: resident.email,
            residentName: resident.name,
            noticeTitle: notice.title,
            noticeContent: notice.content,
            noticeId: notice._id.toString(),
          }).catch((err) => console.error(`Failed to send notice email to ${resident.email}:`, err.message));
        }
      });
    }

    return res.status(201).json({ success: true, message: "Notice posted successfully!", data: { ...notice.toJSON(), id: notice._id.toString() } });
  } catch (error) { next(error); }
}

async function updateNotice(req, res, next) {
  try {
    const { id } = req.params;
    const { title, content, isImportant } = req.body;

    const notice = await Notice.findByIdAndUpdate(
      id,
      { title, content, ...(isImportant !== undefined && { isImportant: !!isImportant }) },
      { new: true, runValidators: true }
    );

    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    return res.status(200).json({ success: true, message: "Notice updated successfully!", data: notice.toJSON() });
  } catch (error) { next(error); }
}

async function deleteNotice(req, res, next) {
  try {
    const { id } = req.params;
    const notice = await Notice.findByIdAndDelete(id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    return res.status(200).json({ success: true, message: "Notice deleted successfully!" });
  } catch (error) { next(error); }
}

module.exports = { getNotices, createNotice, updateNotice, deleteNotice };
