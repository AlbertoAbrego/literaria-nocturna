import { Schema, model, InferSchemaType } from "mongoose";

export enum Genre {
  Romance = "Romance",
  Thriller = "Thriller",
  Fantasy = "Fantasy",
  ScienceFiction = "Science Fiction",
  Dystopia = "Dystopia",
  HistoricalFiction = "Historical Fiction",
  Adventure = "Adventure",
  SelfHelp = "Self Help",
  PopularScience = "Popular Science",
  Horror = "Horror",
  YoungAdult = "Young Adult",
  Children = "Children",
  Health = "Health",
  Sports = "Sports",
  Cooking = "Cooking",
}

const bookSchema = new Schema(
  {
    title: { type: String, required: true },
    author: { type: String, required: true },
    genre: { type: String, enum: Object.values(Genre), required: true },
    synopsis: { type: String, required: true },
  },
  {
    timestamps: true,
  },
);

export type Book = InferSchemaType<typeof bookSchema>;

export const BookModel = model("Book", bookSchema);
