import { CreateBookDto } from "../dto/book/create-book.dto";
import AppError from "../errors/AppError";
import { BookModel } from "../models/book.model";

export async function createBook(book: CreateBookDto) {
  const existingBook = await BookModel.findOne({ title: book.title, author: book.author });
  if (existingBook) {
    throw new AppError("Book already exists.", 409);
  }
  const newBook = await BookModel.create(book);
  return newBook;
}

export async function getBookById(id: string) {
  return await BookModel.findById(id);
}
export async function getAllBooks() {
  return await BookModel.find();
}
