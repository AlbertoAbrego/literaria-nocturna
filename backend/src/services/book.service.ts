import { CreateBookDto } from "../dto/book/create-book.dto";
import { BookModel } from "../models/book.model";

export async function createBook(book: CreateBookDto) {
  const existingBook = await BookModel.findOne({ title: book.title, author: book.author });
  if (existingBook) {
    throw new Error("Book already exists.");
  }
  const newBook = await BookModel.create(book);
  return newBook;
}
