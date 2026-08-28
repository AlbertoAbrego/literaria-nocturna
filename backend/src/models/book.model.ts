import { Schema, model, InferSchemaType } from "mongoose";
import { GENRES } from "../constants/genres";
import type { Genre } from "../constants/genres";

export type { Genre };

const bookSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, enum: GENRES, required: true },
    synopsis: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

bookSchema.index({ title: 1, author: 1 }, { unique: true });

export type Book = InferSchemaType<typeof bookSchema>;

export const BookModel = model("Book", bookSchema);
