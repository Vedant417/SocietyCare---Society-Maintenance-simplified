const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    message: { type: String, required: true },
    complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null },
    isRead: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    ret.userId = ret.userId.toString ? ret.userId.toString() : ret.userId;
    if (ret.complaintId && typeof ret.complaintId === "object") {
      const cId = ret.complaintId.id || ret.complaintId._id;
      if (cId) {
        ret.complaint = {
          id: cId.toString(),
          complaintNumber: ret.complaintId.complaintNumber,
        };
        ret.complaintId = cId.toString();
      } else {
        ret.complaintId = ret.complaintId.toString();
      }
    } else if (ret.complaintId) {
      ret.complaintId = ret.complaintId.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Notification", notificationSchema);
