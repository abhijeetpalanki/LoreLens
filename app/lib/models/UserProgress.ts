import mongoose, { Schema, Document, models } from "mongoose";

export interface IUserProgress extends Document {
  userId: string;
  franchiseId: mongoose.Types.ObjectId;
  currentSeason: number;
  currentEpisode: number;
  status: "Watching" | "Completed" | "Plan to Watch";
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
    status: {
      type: String,
      enum: ["Watching", "Completed", "Plan to Watch"],
      default: "Watching",
    },
  },
  { timestamps: true },
);

UserProgressSchema.index({ userId: 1, franchiseId: 1 }, { unique: true });

export const UserProgress =
  models.UserProgress ||
  mongoose.model<IUserProgress>("UserProgress", UserProgressSchema);
