import { BookQueryDto } from "../dto/book/book-query.dto";
import { CreateBookDto } from "../dto/book/create-book.dto";
import { UpdateBookDto } from "../dto/book/update-book.dto";
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
export async function getAllBooks(filters?: BookQueryDto) {
  const query: Record<string, unknown> = {};

  if (filters?.genre) query.genre = filters.genre;
  if (filters?.author) query.author = { $regex: filters.author, $options: "i" };
  if (filters?.title) query.title = { $regex: filters.title, $options: "i" };

  return await BookModel.find(query).sort({ title: 1 });
}

export async function updateBook(id: string, data: UpdateBookDto) {
  if (data.title || data.author) {
    const query: Record<string, unknown> = {};
    if (data.title) query.title = data.title;
    if (data.author) query.author = data.author;
    query._id = { $ne: id };

    const existingBook = await BookModel.findOne(query);
    if (existingBook) {
      throw new AppError("Book already exists.", 409);
    }
  }

  const updatedBook = await BookModel.findByIdAndUpdate(id, data, {
    new: true,
    runValidators: true,
  });

  return updatedBook;
}

export async function deleteBook(id: string) {
  return await BookModel.findByIdAndDelete(id);
}
