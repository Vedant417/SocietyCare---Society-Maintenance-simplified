const mongoose = require("mongoose");
const Counter = require("./Counter");

const complaintHistorySchema = new mongoose.Schema(
  {
    status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED"], required: true },
    actorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    actorName: { type: String },
    actorRole: { type: String },
    note: { type: String, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// toJSON for history items
complaintHistorySchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

const complaintSchema = new mongoose.Schema(
  {
    complaintNumber: { type: Number, unique: true },
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, required: true },
    description: { type: String, required: true },
    photoUrl: { type: String, default: null },
    photoFileId: { type: mongoose.Schema.Types.ObjectId, default: null },
    status: { type: String, enum: ["OPEN", "IN_PROGRESS", "RESOLVED"], default: "OPEN" },
    priority: { type: String, enum: ["LOW", "MEDIUM", "HIGH"], default: "MEDIUM" },
    resolvedAt: { type: Date, default: null },
    history: [complaintHistorySchema],

    // --- Feature 1: Duplicate Detection ---
    relatedComplaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null },
    duplicateConfidence: { type: Number, default: null }, // 0–100

    // --- Feature 3: Escalation ---
    escalationLevel: { type: String, enum: ["HEALTHY", "APPROACHING_SLA", "AT_RISK", "OVERDUE", "ESCALATED"], default: null },
    escalatedAt: { type: Date, default: null },

    // --- Feature 4: Satisfaction & Reopen ---
    reopenCount: { type: Number, default: 0 },
    satisfactionRating: { type: String, enum: ["SATISFIED", "NEUTRAL", "NOT_SATISFIED", null], default: null },
    satisfactionFeedback: { type: String, default: null },
    satisfactionSubmittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Auto-assign complaintNumber before saving new doc
complaintSchema.pre("save", async function () {
  if (this.isNew) {
    this.complaintNumber = await Counter.getNextSequence("complaintNumber");
  }
});

complaintSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id ? ret._id.toString() : ret.id;
    // Set dynamic photoUrl if GridFS reference exists
    if (ret.photoFileId) {
      ret.photoUrl = `/api/complaints/${ret.id}/photo`;
      ret.photoFileId = ret.photoFileId.toString();
    }
    // Handle residentId whether it's a plain ObjectId or a populated doc
    if (ret.residentId) {
      if (typeof ret.residentId === "object" && ret.residentId._id) {
        // Populated - has _id inside
        ret.resident = { name: ret.residentId.name, email: ret.residentId.email, phone: ret.residentId.phone, apartmentNumber: ret.residentId.apartmentNumber };
        ret.residentId = ret.residentId._id.toString();
      } else {
        // Plain ObjectId
        ret.residentId = ret.residentId.toString();
      }
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Complaint", complaintSchema);


