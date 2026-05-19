import mongoose from "mongoose";

const noteSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true, trim: true },
    category: { type: String, required: true, trim: true },
    status: {
      type: String,
      required: true,
      enum: ["Todo", "In Progress", "Completed"],
      default: "Todo",
    },
  },
  { timestamps: true },
);

export const Note = mongoose.model("Note", noteSchema);
