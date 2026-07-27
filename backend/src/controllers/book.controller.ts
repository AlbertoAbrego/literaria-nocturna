import { Request, Response, NextFunction } from "express";
import * as BookService from "../services/book.service";
import { CreateBookDto } from "../dto/book/create-book.dto";
import AppError from "../errors/AppError";
import mongoose from "mongoose";

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
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const books = await BookService.getAllBooks();
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
