import { Request, Response, NextFunction } from "express";
import * as BookService from "../services/book.service";
import { CreateBookDto } from "../dto/book/create-book.dto";

export async function createBook(
  req: Request<Record<string, never>, Record<string, never>, CreateBookDto>,
  res: Response,
  next: NextFunction,
) {
  try {
    const book = await BookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
}
