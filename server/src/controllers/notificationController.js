const Notification = require("../models/Notification");

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await Notification.find({ userId })
      .populate("complaintId", "id complaintNumber")
      .sort({ createdAt: -1 })
      .lean();

    const mapped = notifications.map((n) => ({
      ...n,
      id: n._id.toString(),
      userId: n.userId.toString(),
      complaintId: n.complaintId ? n.complaintId._id?.toString() : null,
      complaint: n.complaintId ? { id: n.complaintId._id?.toString(), complaintNumber: n.complaintId.complaintNumber } : null,
    }));

    return res.status(200).json({ success: true, data: mapped });
  } catch (error) { next(error); }
}

async function markAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
    if (notification.userId.toString() !== userId) return res.status(403).json({ success: false, message: "Access denied." });

    notification.isRead = true;
    await notification.save();

    return res.status(200).json({ success: true, message: "Notification marked as read.", data: notification.toJSON() });
  } catch (error) { next(error); }
}

async function markAllAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    return res.status(200).json({ success: true, message: "All notifications marked as read." });
  } catch (error) { next(error); }
}

async function deleteNotification(req, res, next) {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const notification = await Notification.findById(id);
    if (!notification) return res.status(404).json({ success: false, message: "Notification not found." });
    if (notification.userId.toString() !== userId) return res.status(403).json({ success: false, message: "Access denied." });

    await Notification.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Notification deleted successfully." });
  } catch (error) { next(error); }
}

module.exports = { getNotifications, markAsRead, markAllAsRead, deleteNotification };
