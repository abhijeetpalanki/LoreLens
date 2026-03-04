import mongoose, { Schema, Document, models } from "mongoose";

export interface IFranchise extends Document {
  tmdbId: number;
  title: string;
  type: "Movie" | "TV" | "Anime";
  description: string;
  coverImage: string;
}

const FranchiseSchema = new Schema<IFranchise>({
  tmdbId: { type: Number, required: true, unique: true },
  title: { type: String, required: true },
  type: { type: String, enum: ["Movie", "TV", "Anime"], required: true },
  description: { type: String },
  coverImage: { type: String },
});

export const Franchise =
  models.Franchise || mongoose.model<IFranchise>("Franchise", FranchiseSchema);
