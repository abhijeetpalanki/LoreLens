import { Schema, model, models } from "mongoose";

const ChatMessageSchema = new Schema(
  {
    userId: { type: String, required: true, index: true },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
      index: true,
    },
    role: { type: String, enum: ["user", "model", "system"], required: true },
    content: { type: String, required: true },
  },
  { timestamps: true },
);

ChatMessageSchema.index({ userId: 1, franchiseId: 1 });

export const ChatMessage =
  models.ChatMessage || model("ChatMessage", ChatMessageSchema);
