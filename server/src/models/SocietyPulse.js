const mongoose = require("mongoose");

const societyPulseSchema = new mongoose.Schema(
  {
    maintenance: {
      type: String,
      enum: ["GOOD", "NORMAL", "WARNING", "CRITICAL"],
      default: "GOOD"
    },
    waterSupply: {
      type: String,
      enum: ["GOOD", "NORMAL", "WARNING", "CRITICAL"],
      default: "NORMAL"
    },
    power: {
      type: String,
      enum: ["GOOD", "NORMAL", "WARNING", "CRITICAL"],
      default: "GOOD"
    },
    commonAreas: {
      type: String,
      enum: ["GOOD", "NORMAL", "WARNING", "CRITICAL"],
      default: "GOOD"
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  { timestamps: true }
);

// toJSON conversion helper
societyPulseSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  }
});

module.exports = mongoose.model("SocietyPulse", societyPulseSchema);
