import { BookModel } from "../../models/book.model";
import type { Book } from "../../models/book.model";

export async function clearDatabase(): Promise<void> {
  await BookModel.deleteMany({});
}

export async function seedBooks(books: Partial<Book>[]): Promise<Book[]> {
  const created = await BookModel.create(books);
  return created.map((book) => book.toObject());
}
