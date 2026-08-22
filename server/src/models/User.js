const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    apartmentNumber: { type: String, required: true, trim: true },
    passwordHash: { type: String, required: true },
    profilePhotoUrl: { type: String, default: null },
    gender: { type: String, enum: ["MALE", "FEMALE", "OTHER", null], default: null },
    dateOfBirth: { type: Date, default: null },
    role: { type: String, enum: ["RESIDENT", "ADMIN"], default: "RESIDENT" },
    weatherLatitude: { type: Number, default: null },
    weatherLongitude: { type: Number, default: null },
    weatherLocationName: { type: String, default: null },
  },
  { timestamps: true }
);

// Virtual `id` that mirrors `_id` as string (for API compatibility)
userSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    delete ret.passwordHash;
    return ret;
  },
});

module.exports = mongoose.model("User", userSchema);
