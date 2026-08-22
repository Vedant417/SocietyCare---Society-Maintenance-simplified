const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../../.env") });
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/societycare";

// Inline User schema to avoid circular deps
const userSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    phone: String,
    apartmentNumber: String,
    passwordHash: String,
    profilePhotoUrl: { type: String, default: null },
    gender: { type: String, default: null },
    dateOfBirth: { type: Date, default: null },
    role: { type: String, default: "RESIDENT" },
  },
  { timestamps: true }
);
const User = mongoose.model("User", userSchema);

const counterSchema = new mongoose.Schema({ _id: String, seq: { type: Number, default: 0 } });
const Counter = mongoose.model("Counter", counterSchema);

const settingSchema = new mongoose.Schema({ key: { type: String, unique: true }, value: String }, { timestamps: { createdAt: false, updatedAt: true } });
const Setting = mongoose.model("SystemSetting", settingSchema);

async function seed() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  // Admin user
  const adminEmail = "admin@societycare.com";
  const existing = await User.findOne({ email: adminEmail });
  if (!existing) {
    const passwordHash = await bcrypt.hash("Admin@123", 10);
    await User.create({
      name: "Admin User",
      email: adminEmail,
      phone: "9999999999",
      apartmentNumber: "A-00",
      passwordHash,
      role: "ADMIN",
    });
    console.log("Admin user created: admin@societycare.com / Admin@123");
  } else {
    console.log("Admin already exists:", adminEmail);
  }

  // Initialize complaint counter
  await Counter.findByIdAndUpdate(
    "complaintNumber",
    { $setOnInsert: { seq: 1000 } },
    { upsert: true }
  );
  console.log("Complaint counter initialized at 1000");

  // Default settings
  await Setting.findOneAndUpdate(
    { key: "complaint_overdue_days" },
    { value: "3" },
    { upsert: true }
  );
  console.log("Default system settings seeded");

  await mongoose.disconnect();
  console.log("Seeding complete!");
}

seed().catch((err) => { console.error("Seed failed:", err); process.exit(1); });
