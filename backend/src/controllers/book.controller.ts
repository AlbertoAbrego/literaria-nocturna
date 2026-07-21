import { Request, Response, NextFunction } from "express";
import * as BookService from "../services/book.service";
import { CreateBookDto } from "../dto/book/create-book.dto";
import AppError from "../errors/AppError";

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
