const FamilyMember = require("../models/FamilyMember");

async function getFamilyMembers(req, res, next) {
  try {
    const residentId = req.user.id;
    const members = await FamilyMember.find({ residentId }).sort({ createdAt: 1 }).lean();
    const mapped = members.map((m) => ({ ...m, id: m._id.toString() }));
    return res.status(200).json({ success: true, data: mapped });
  } catch (error) { next(error); }
}

async function addFamilyMember(req, res, next) {
  try {
    const residentId = req.user.id;
    const { name, relation, gender, dateOfBirth } = req.body;

    if (!name || !relation) {
      return res.status(400).json({ success: false, message: "Name and relation are required." });
    }

    const member = await FamilyMember.create({
      residentId,
      name: name.trim(),
      relation: relation.trim(),
      gender: gender || null,
      dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : null,
    });

    return res.status(201).json({ success: true, message: "Family member added successfully!", data: { ...member.toJSON(), id: member._id.toString() } });
  } catch (error) { next(error); }
}

async function deleteFamilyMember(req, res, next) {
  try {
    const residentId = req.user.id;
    const { id } = req.params;

    const member = await FamilyMember.findById(id);
    if (!member) return res.status(404).json({ success: false, message: "Family member not found." });
    if (member.residentId.toString() !== residentId) return res.status(403).json({ success: false, message: "Access denied." });

    await FamilyMember.findByIdAndDelete(id);
    return res.status(200).json({ success: true, message: "Family member removed." });
  } catch (error) { next(error); }
}

module.exports = { getFamilyMembers, addFamilyMember, deleteFamilyMember };
