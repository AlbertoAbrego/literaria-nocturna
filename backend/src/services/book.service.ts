import {
  BookQueryDto,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
} from "../dto/book/book-query.dto";
import { CreateBookDto } from "../dto/book/create-book.dto";
import { UpdateBookDto } from "../dto/book/update-book.dto";
import { AppError } from "../errors/AppError";
import { BookModel } from "../models/book.model";

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

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
  if (filters?.author && filters.author.trim()) query.author = { $regex: escapeRegex(filters.author), $options: "i" };
  if (filters?.title && filters.title.trim()) query.title = { $regex: escapeRegex(filters.title), $options: "i" };

  const page = filters?.page ?? DEFAULT_PAGE;
  const limit = filters?.limit ?? DEFAULT_LIMIT;
  const skip = (page - 1) * limit;

  const [books, total] = await Promise.all([
    BookModel.find(query).skip(skip).limit(limit).sort({ title: 1 }),
    BookModel.countDocuments(query),
  ]);

  return {
    data: books,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
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
