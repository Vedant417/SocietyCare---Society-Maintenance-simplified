const User = require("../models/User");
const Complaint = require("../models/Complaint");
const FamilyMember = require("../models/FamilyMember");

async function getResidents(req, res, next) {
  try {
    const residents = await User.find({ role: "RESIDENT" })
      .select("id name email phone apartmentNumber gender dateOfBirth createdAt")
      .sort({ name: 1 })
      .lean();

    // Get complaint and family member counts for each resident
    const residentIds = residents.map((r) => r._id);

    const [complaintCounts, memberCounts] = await Promise.all([
      Complaint.aggregate([
        { $match: { residentId: { $in: residentIds } } },
        { $group: { _id: "$residentId", count: { $sum: 1 } } },
      ]),
      FamilyMember.aggregate([
        { $match: { residentId: { $in: residentIds } } },
        { $group: { _id: "$residentId", count: { $sum: 1 } } },
      ]),
    ]);

    const complaintMap = {};
    complaintCounts.forEach((c) => { complaintMap[c._id.toString()] = c.count; });
    const memberMap = {};
    memberCounts.forEach((m) => { memberMap[m._id.toString()] = m.count; });

    const data = residents.map((r) => ({
      ...r,
      id: r._id.toString(),
      _count: {
        complaints: complaintMap[r._id.toString()] || 0,
        familyMembers: memberMap[r._id.toString()] || 0,
      },
    }));

    return res.status(200).json({ success: true, data });
  } catch (error) {
    next(error);
  }
}

module.exports = { getResidents };
