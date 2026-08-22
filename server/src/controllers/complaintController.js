const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { notifyComplaintStatusChange } = require("../services/notificationService");
const SystemSetting = require("../models/SystemSetting");

async function getOverdueThresholdDays() {
  try {
    const setting = await SystemSetting.findOne({ key: "complaint_overdue_days" });
    return setting ? parseInt(setting.value, 10) : parseInt(process.env.OVERDUE_DAYS || "3", 10);
  } catch {
    return 3;
  }
}

/**
 * Compute escalation level for a complaint (Phase 3)
 * deterministic rules — no fuzzy logic
 */
function computeEscalationLevel(complaint, thresholdDate, overdueDays) {
  if (complaint.status === "RESOLVED") return "HEALTHY";

  const createdAt = new Date(complaint.createdAt);
  const now = new Date();
  const ageMs = now - createdAt;
  const thresholdMs = overdueDays * 24 * 60 * 60 * 1000;
  const ageRatio = ageMs / thresholdMs;

  const isOverdue = createdAt < thresholdDate;

  if (isOverdue && complaint.priority === "HIGH") return "ESCALATED";
  if (isOverdue) return "OVERDUE";
  if (ageRatio >= 0.75) return "AT_RISK";
  if (ageRatio >= 0.5) return "APPROACHING_SLA";
  return "HEALTHY";
}

function getEscalationReason(level, complaint) {
  switch (level) {
    case "ESCALATED": return "High priority complaint is overdue and unresolved";
    case "OVERDUE": return "Complaint has exceeded the resolution SLA";
    case "AT_RISK": return "Complaint is 75%+ through its SLA window";
    case "APPROACHING_SLA": return "Complaint is past the 50% SLA mark";
    case "HEALTHY": return "Complaint is within acceptable time limits";
    default: return "";
  }
}

/**
 * Create a new complaint (Resident only)
 */
async function createComplaint(req, res, next) {
  try {
    const { category, description, priority } = req.body;
    const residentId = req.user.id;

    if (!category || !description) {
      return res.status(400).json({ success: false, message: "Category and description are required." });
    }

    let photoFileId = null;
    if (req.file) {
      const { uploadToGridFS } = require("../services/gridfsService");
      photoFileId = await uploadToGridFS(req.file.buffer, req.file.originalname, req.file.mimetype);
    }

    const complaint = await Complaint.create({
      residentId,
      category,
      description,
      photoFileId,
      priority: priority || "MEDIUM",
      history: [{
        status: "OPEN",
        actorId: residentId,
        note: "Complaint raised and registered.",
      }],
    });

    // Notify all admins of new complaint
    try {
      const admins = await User.find({ role: "ADMIN" });
      const { sendRealTimeNotification } = require("../config/socket");
      for (const admin of admins) {
        const notif = await Notification.create({
          userId: admin._id,
          type: "NEW_COMPLAINT",
          message: `${req.user.name} has raised a new complaint`,
          complaintId: complaint._id,
        });
        const populatedNotif = await Notification.findById(notif._id).populate("complaintId", "id complaintNumber");
        sendRealTimeNotification(admin._id.toString(), populatedNotif.toJSON());
      }
    } catch (notifError) {
      console.error("Failed to notify admins:", notifError.message);
    }

    return res.status(201).json({
      success: true,
      message: "Complaint raised successfully!",
      data: complaint.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Get complaints (Admin sees all; Resident sees own)
 */
async function getComplaints(req, res, next) {
  try {
    const { status, priority, category, overdue, search } = req.query;

    const overdueDays = await getOverdueThresholdDays();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - overdueDays);

    const filter = {};

    // Residents see only their own
    if (req.user.role === "RESIDENT") {
      filter.residentId = req.user.id;
    }

    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (category) filter.category = category;
    if (overdue === "true") {
      filter.status = { $ne: "RESOLVED" };
      filter.createdAt = { $lt: thresholdDate };
    }

    if (search) {
      const searchNum = Number(search.trim().replace(/^SC-/, ""));
      if (!isNaN(searchNum) && search.trim() !== "") {
        filter.$or = [{ complaintNumber: searchNum }];
      }
    }

    let complaints = await Complaint.find(filter)
      .populate("residentId", "name email phone apartmentNumber")
      .sort({ createdAt: -1 })
      .lean();

    // If search by resident name/flat (non-numeric)
    if (search && isNaN(Number(search.trim().replace(/^SC-/, "")))) {
      const regex = new RegExp(search.trim(), "i");
      complaints = complaints.filter(
        (c) =>
          (c.residentId && c.residentId.name && regex.test(c.residentId.name)) ||
          (c.residentId && c.residentId.apartmentNumber && regex.test(c.residentId.apartmentNumber))
      );
    }

    const mapped = complaints.map((c) => {
      const isOverdue = c.status !== "RESOLVED" && new Date(c.createdAt) < thresholdDate;
      const escalationLevel = computeEscalationLevel(c, thresholdDate, overdueDays);
      return {
        ...c,
        id: c._id.toString(),
        residentId: c.residentId ? c.residentId._id?.toString() || c.residentId.toString() : null,
        resident: c.residentId && c.residentId.name ? {
          name: c.residentId.name,
          email: c.residentId.email,
          phone: c.residentId.phone,
          apartmentNumber: c.residentId.apartmentNumber,
        } : undefined,
        isOverdue,
        escalationLevel,
        escalationReason: getEscalationReason(escalationLevel, c),
      };
    });

    mapped.sort((a, b) => {
      if (a.isOverdue && !b.isOverdue) return -1;
      if (!a.isOverdue && b.isOverdue) return 1;
      return new Date(b.createdAt) - new Date(a.createdAt);
    });

    return res.status(200).json({ success: true, data: mapped });
  } catch (error) {
    next(error);
  }
}

/**
 * Get complaint details by ID
 */
async function getComplaintById(req, res, next) {
  try {
    const { id } = req.params;

    const complaint = await Complaint.findById(id)
      .populate("residentId", "name email phone apartmentNumber")
      .populate("history.actorId", "name role")
      .lean();

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Auth check: Resident can only view their own complaint
    if (req.user.role === "RESIDENT" && complaint.residentId._id.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Access denied. You can only view your own complaints." });
    }

    const overdueDays = await getOverdueThresholdDays();
    const thresholdDate = new Date();
    thresholdDate.setDate(thresholdDate.getDate() - overdueDays);
    const isOverdue = complaint.status !== "RESOLVED" && new Date(complaint.createdAt) < thresholdDate;
    const escalationLevel = computeEscalationLevel(complaint, thresholdDate, overdueDays);

    // If newly escalated, persist escalatedAt (best-effort)
    if (escalationLevel === "ESCALATED" && !complaint.escalatedAt) {
      try {
        await Complaint.findByIdAndUpdate(complaint._id, { escalatedAt: new Date(), escalationLevel: "ESCALATED" });
      } catch (_) {}
    }

    // Normalize history actor
    const history = (complaint.history || []).map((h) => ({
      id: h._id.toString(),
      status: h.status,
      note: h.note,
      createdAt: h.createdAt,
      actor: h.actorId ? { name: h.actorId.name, role: h.actorId.role } : { name: "System", role: "ADMIN" },
    }));

    return res.status(200).json({
      success: true,
      data: {
        ...complaint,
        id: complaint._id.toString(),
        residentId: complaint.residentId._id.toString(),
        resident: {
          name: complaint.residentId.name,
          email: complaint.residentId.email,
          phone: complaint.residentId.phone,
          apartmentNumber: complaint.residentId.apartmentNumber,
        },
        history,
        isOverdue,
        escalationLevel,
        escalationReason: getEscalationReason(escalationLevel, complaint),
      },
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update complaint status & add history (Admin only)
 */
async function updateComplaintStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const adminId = req.user.id;

    const complaint = await Complaint.findById(id).populate("residentId", "name email");
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Push history entry
    complaint.history.push({
      status,
      actorId: adminId,
      actorName: req.user.name,
      actorRole: req.user.role,
      note: note || `Status updated to ${status.replace("_", " ")} by Secretary.`,
    });

    complaint.status = status;
    complaint.resolvedAt = status === "RESOLVED" ? new Date() : null;
    await complaint.save();

    // Create notification for resident
    try {
      const newNotification = await Notification.create({
        userId: complaint.residentId._id,
        type: "STATUS_UPDATED",
        message: `Your complaint status was updated to ${status.replace("_", " ")}${note ? `: "${note}"` : ""}`,
        complaintId: complaint._id,
      });
      const populated = await Notification.findById(newNotification._id).populate("complaintId", "id complaintNumber");
      const { sendRealTimeNotification } = require("../config/socket");
      sendRealTimeNotification(complaint.residentId._id.toString(), populated.toJSON());
    } catch (notifError) {
      console.error("Failed to send status update notification:", notifError.message);
    }

    // Email notification
    if (complaint.residentId && complaint.residentId.email) {
      notifyComplaintStatusChange({
        residentEmail: complaint.residentId.email,
        residentName: complaint.residentId.name,
        complaintNumber: complaint.complaintNumber,
        category: complaint.category,
        status,
        note,
        complaintId: complaint._id.toString(),
      });
    }

    return res.status(200).json({
      success: true,
      message: `Complaint status updated to ${status} successfully!`,
      data: complaint.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update complaint priority (Admin only)
 */
async function updateComplaintPriority(req, res, next) {
  try {
    const { id } = req.params;
    const { priority } = req.body;

    const complaint = await Complaint.findByIdAndUpdate(
      id,
      { priority },
      { new: true }
    );

    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    // Notify resident
    try {
      const newNotification = await Notification.create({
        userId: complaint.residentId,
        type: "PRIORITY_CHANGED",
        message: `Your complaint priority was updated to ${priority}`,
        complaintId: complaint._id,
      });
      const populated = await Notification.findById(newNotification._id).populate("complaintId", "id complaintNumber");
      const { sendRealTimeNotification } = require("../config/socket");
      sendRealTimeNotification(complaint.residentId.toString(), populated.toJSON());
    } catch (notifError) {
      console.error("Failed to send priority update notification:", notifError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Complaint priority updated successfully!",
      data: complaint.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Check for similar/duplicate complaints (Resident only)
 * POST /complaints/check-duplicate
 */
async function checkDuplicates(req, res, next) {
  try {
    const { category, description } = req.body;
    const residentId = req.user.id;

    if (!category || !description) {
      return res.status(400).json({ success: false, message: "Category and description are required." });
    }

    const overdueDays = await getOverdueThresholdDays();
    const windowDate = new Date();
    windowDate.setDate(windowDate.getDate() - 90); // look back 90 days

    // Fetch recent complaints in same category (all residents) that are not resolved
    const candidates = await Complaint.find({
      category,
      status: { $ne: "RESOLVED" },
      createdAt: { $gte: windowDate },
    })
      .populate("residentId", "name apartmentNumber")
      .lean();

    if (candidates.length === 0) {
      return res.status(200).json({ success: true, data: { hasDuplicate: false, matches: [] } });
    }

    // Simple keyword overlap scoring
    const inputWords = description.toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3);

    const scored = candidates
      .map((c) => {
        const candidateWords = c.description.toLowerCase()
          .replace(/[^a-z0-9 ]/g, " ")
          .split(/\s+/)
          .filter((w) => w.length > 3);

        const commonWords = inputWords.filter((w) => candidateWords.includes(w));
        const totalUnique = new Set([...inputWords, ...candidateWords]).size;
        const confidence = totalUnique > 0 ? Math.round((commonWords.length / totalUnique) * 100) : 0;

        return { complaint: c, confidence };
      })
      .filter((s) => s.confidence >= 25) // 25% overlap threshold
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 3);

    if (scored.length === 0) {
      return res.status(200).json({ success: true, data: { hasDuplicate: false, matches: [] } });
    }

    const matches = scored.map(({ complaint: c, confidence }) => ({
      id: c._id.toString(),
      complaintNumber: c.complaintNumber,
      description: c.description,
      status: c.status,
      category: c.category,
      createdAt: c.createdAt,
      resident: c.residentId ? { name: c.residentId.name, apartmentNumber: c.residentId.apartmentNumber } : null,
      confidence,
    }));

    return res.status(200).json({ success: true, data: { hasDuplicate: true, matches } });
  } catch (error) {
    next(error);
  }
}

/**
 * Submit satisfaction rating after complaint resolved (Resident only)
 * PATCH /complaints/:id/satisfaction
 */
async function submitSatisfaction(req, res, next) {
  try {
    const { id } = req.params;
    const { rating, feedback } = req.body;
    const residentId = req.user.id;

    const validRatings = ["SATISFIED", "NEUTRAL", "NOT_SATISFIED"];
    if (!validRatings.includes(rating)) {
      return res.status(400).json({ success: false, message: "Invalid rating. Must be SATISFIED, NEUTRAL, or NOT_SATISFIED." });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (complaint.residentId.toString() !== residentId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (complaint.status !== "RESOLVED") {
      return res.status(400).json({ success: false, message: "You can only rate resolved complaints." });
    }

    if (complaint.satisfactionRating) {
      return res.status(400).json({ success: false, message: "You have already submitted a rating for this complaint." });
    }

    complaint.satisfactionRating = rating;
    complaint.satisfactionFeedback = feedback ? feedback.trim() : null;
    complaint.satisfactionSubmittedAt = new Date();
    await complaint.save();

    // Notify admins
    try {
      const admins = await User.find({ role: "ADMIN" });
      const { sendRealTimeNotification } = require("../config/socket");
      for (const admin of admins) {
        const notif = await Notification.create({
          userId: admin._id,
          type: "STATUS_UPDATED",
          message: `Resident ${req.user.name} submitted satisfaction feedback for complaint #NF-${complaint.complaintNumber}.`,
          complaintId: complaint._id,
        });
        const populatedNotif = await Notification.findById(notif._id).populate("complaintId", "id complaintNumber");
        sendRealTimeNotification(admin._id.toString(), populatedNotif.toJSON());
      }
    } catch (notifError) {
      console.error("Failed to notify admins of satisfaction rating:", notifError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Thank you for your feedback!",
      data: complaint.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Reopen a resolved complaint (Resident only)
 * PATCH /complaints/:id/reopen
 */
async function reopenComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const residentId = req.user.id;
    const { reason } = req.body;

    const complaint = await Complaint.findById(id).populate("residentId", "name email");
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    if (complaint.residentId._id.toString() !== residentId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (complaint.status !== "RESOLVED") {
      return res.status(400).json({ success: false, message: "Only resolved complaints can be reopened." });
    }

    // Push new history entry, preserve all prior history
    complaint.history.push({
      status: "OPEN",
      actorId: residentId,
      actorName: req.user.name,
      actorRole: req.user.role,
      note: reason ? `Reopened: ${reason}` : "Complaint reopened by resident.",
    });

    complaint.status = "OPEN";
    complaint.resolvedAt = null;
    complaint.satisfactionRating = null;
    complaint.satisfactionFeedback = null;
    complaint.satisfactionSubmittedAt = null;
    complaint.reopenCount = (complaint.reopenCount || 0) + 1;
    await complaint.save();

    // Notify admins
    try {
      const admins = await User.find({ role: "ADMIN" });
      const { sendRealTimeNotification } = require("../config/socket");
      for (const admin of admins) {
        const notif = await Notification.create({
          userId: admin._id,
          type: "NEW_COMPLAINT",
          message: `${req.user.name} has reopened complaint #NF-${complaint.complaintNumber}`,
          complaintId: complaint._id,
        });
        const populatedNotif = await Notification.findById(notif._id).populate("complaintId", "id complaintNumber");
        sendRealTimeNotification(admin._id.toString(), populatedNotif.toJSON());
      }
    } catch (notifError) {
      console.error("Failed to notify admins of reopen:", notifError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Complaint has been reopened successfully.",
      data: complaint.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Delete a complaint (Resident only, belongs to resident)
 * DELETE /complaints/:id
 */
async function deleteComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    if (role !== "RESIDENT") {
      return res.status(403).json({ success: false, message: "Forbidden. Only residents can delete complaints." });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (complaint.residentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied. You can only delete your own complaints." });
    }

    await Complaint.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: "Complaint deleted successfully.",
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Update/Edit a complaint (Resident only, category & description only, owns complaint)
 * PATCH /complaints/:id
 */
async function updateComplaint(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;
    const { category, description } = req.body;

    if (role !== "RESIDENT") {
      return res.status(403).json({ success: false, message: "Forbidden. Only residents can update complaints." });
    }

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found" });
    }

    if (complaint.residentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied. You can only edit your own complaints." });
    }

    if (category) complaint.category = category;
    if (description) complaint.description = description;

    // Push history entry for the edit
    complaint.history.push({
      status: complaint.status,
      actorId: userId,
      actorName: req.user.name,
      actorRole: role,
      note: "Complaint details updated by resident.",
    });

    await complaint.save();

    // Notify admins of the update
    try {
      const admins = await User.find({ role: "ADMIN" });
      const { sendRealTimeNotification } = require("../config/socket");
      for (const admin of admins) {
        const notif = await Notification.create({
          userId: admin._id,
          type: "STATUS_UPDATED",
          message: `Resident ${req.user.name} updated complaint #NF-${complaint.complaintNumber}.`,
          complaintId: complaint._id,
        });
        const populatedNotif = await Notification.findById(notif._id).populate("complaintId", "id complaintNumber");
        sendRealTimeNotification(admin._id.toString(), populatedNotif.toJSON());
      }
    } catch (notifError) {
      console.error("Failed to notify admins of complaint update:", notifError.message);
    }

    return res.status(200).json({
      success: true,
      message: "Complaint updated successfully.",
      data: complaint.toJSON(),
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Serve a complaint photo directly from GridFS
 * GET /complaints/:id/photo
 */
async function getComplaintPhoto(req, res, next) {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const role = req.user.role;

    const complaint = await Complaint.findById(id);
    if (!complaint) {
      return res.status(404).json({ success: false, message: "Complaint not found." });
    }

    // Authorization check: only Admin OR the owner can access the photo
    if (role !== "ADMIN" && complaint.residentId.toString() !== userId) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    if (!complaint.photoFileId) {
      return res.status(404).json({ success: false, message: "No photo attached to this complaint." });
    }

    const { downloadFromGridFS } = require("../services/gridfsService");
    const fileData = await downloadFromGridFS(complaint.photoFileId);

    if (!fileData) {
      return res.status(404).json({ success: false, message: "Photo file not found in database." });
    }

    res.setHeader("Content-Type", fileData.contentType);
    // Stream the file directly from GridFS to response
    fileData.stream.pipe(res);
  } catch (error) {
    next(error);
  }
}

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  updateComplaintPriority,
  checkDuplicates,
  submitSatisfaction,
  reopenComplaint,
  deleteComplaint,
  updateComplaint,
  getComplaintPhoto,
};
