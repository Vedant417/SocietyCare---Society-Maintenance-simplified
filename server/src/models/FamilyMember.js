const mongoose = require("mongoose");

const familyMemberSchema = new mongoose.Schema(
  {
    residentId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    relation: { type: String, required: true, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER", null], default: null },
    dateOfBirth: { type: Date, default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

familyMemberSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("FamilyMember", familyMemberSchema);
