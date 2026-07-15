import { Request, Response } from "express";
import * as BookService from "../services/book.service";
import { CreateBookDto } from "../dto/book/create-book.dto";

export async function createBook(
  req: Request<Record<string, never>, Record<string, never>, CreateBookDto>,
  res: Response,
) {
  try {
    const book = await BookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    console.error("Couldn't create book", error);
    res.status(500).json({
      message: "Couldn't create book",
    });
  }
}
