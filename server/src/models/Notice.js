const mongoose = require("mongoose");

const noticeSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    isImportant: { type: Boolean, default: false },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

noticeSchema.set("toJSON", {
  virtuals: true,
  transform: (doc, ret) => {
    ret.id = ret._id.toString();
    if (ret.authorId && ret.authorId._id) {
      ret.author = { name: ret.authorId.name, role: ret.authorId.role };
      ret.authorId = ret.authorId._id.toString();
    }
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

module.exports = mongoose.model("Notice", noticeSchema);
