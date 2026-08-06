import { Request, Response, NextFunction } from "express";
import * as BookService from "../services/book.service";
import { BookQueryDto } from "../dto/book/book-query.dto";
import { CreateBookDto } from "../dto/book/create-book.dto";
import { UpdateBookDto } from "../dto/book/update-book.dto";
import AppError from "../errors/AppError";
import mongoose from "mongoose";
import { Genre } from "../models/book.model";

export async function createBook(
  req: Request<Record<string, never>, Record<string, never>, CreateBookDto>,
  res: Response,
  next: NextFunction,
) {
  if(!req.body){
    return next(new AppError("Request body is missing", 400));
  }
  try {
    const book = await BookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
}

export async function getAllBooks(
  req: Request<Record<string, never>, Record<string, never>, Record<string, never>, BookQueryDto>,
  res: Response,
  next: NextFunction,
) {
  const { genre, author, title } = req.query;

  if (genre && !Object.values(Genre).includes(genre as Genre)) {
    return next(new AppError("Invalid genre", 400));
  }

  const filters: BookQueryDto = {
    genre: genre as Genre | undefined,
    author: author as string | undefined,
    title: title as string | undefined,
  };

  try {
    const books = await BookService.getAllBooks(filters);
    res.status(200).json(books);
  } catch (error) {
    next(error);
  }
}

type GetBookParams = {
  id: string;
};

export async function getBookById(
  req: Request<GetBookParams>,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid ID", 400));
  }
  try {
    const book = await BookService.getBookById(id);
    if (!book) {
      return next(new AppError("Book not found", 404));
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
}

type UpdateBookParams = {
  id: string;
};

export async function updateBook(
  req: Request<UpdateBookParams, Record<string, never>, UpdateBookDto>,
  res: Response,
  next: NextFunction,
) {
  if (!req.body || Object.keys(req.body).length === 0) {
    return next(new AppError("Request body is missing", 400));
  }
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid ID", 400));
  }
  try {
    const book = await BookService.updateBook(id, req.body);
    if (!book) {
      return next(new AppError("Book not found", 404));
    }
    res.status(200).json(book);
  } catch (error) {
    next(error);
  }
}

type DeleteBookParams = {
  id: string;
};

export async function deleteBook(
  req: Request<DeleteBookParams>,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid ID", 400));
  }
  try {
    const book = await BookService.deleteBook(id);
    if (!book) {
      return next(new AppError("Book not found", 404));
    }
    res.status(204).send();
  } catch (error) {
    next(error);
  }
}
