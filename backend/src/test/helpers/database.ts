import { BookModel } from "../../models/book.model";
import type { Book } from "../../models/book.model";
import type { HydratedDocument } from "mongoose";

export type SeededBook = HydratedDocument<Book>;

export async function clearDatabase(): Promise<void> {
  await BookModel.deleteMany({});
}

export async function seedBooks(books: Partial<Book>[]): Promise<SeededBook[]> {
  return BookModel.create(books);
}
