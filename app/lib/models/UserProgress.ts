import mongoose, { Schema, Document, models } from "mongoose";

export interface IUserProgress extends Document {
  userId: string;
  franchiseId: mongoose.Types.ObjectId;
  currentSeason: number;
  currentEpisode: number;
  isSpoilerMode: boolean;
  status: "New" | "Watching" | "Completed" | "Re-watching" | "Plan to Watch";
}

const UserProgressSchema = new Schema<IUserProgress>(
  {
    userId: { type: String, required: true, index: true },
    franchiseId: {
      type: Schema.Types.ObjectId,
      ref: "Franchise",
      required: true,
    },
    currentSeason: { type: Number, default: 1 },
    currentEpisode: { type: Number, default: 1 },
    isSpoilerMode: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["New", "Watching", "Completed", "Re-watching", "Plan to Watch"],
      default: "New",
    },
  },
  { timestamps: true },
);

UserProgressSchema.index({ userId: 1, franchiseId: 1 }, { unique: true });

export const UserProgress =
  models.UserProgress ||
  mongoose.model<IUserProgress>("UserProgress", UserProgressSchema);
