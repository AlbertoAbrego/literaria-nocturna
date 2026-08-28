import { Request, Response, NextFunction } from "express";
import * as BookService from "../services/book.service";
import { BookQueryDto, DEFAULT_LIMIT, DEFAULT_PAGE } from "../dto/book/book-query.dto";
import { CreateBookDto } from "../dto/book/create-book.dto";
import { UpdateBookDto } from "../dto/book/update-book.dto";
import { AppError, ErrorCodes } from "../errors/AppError";
import mongoose from "mongoose";
import type { Genre } from "../constants/genres";
import {
  validateCreateBookDto,
  validateUpdateBookDto,
  validateBookQueryDto,
} from "../utils/dto-validation";

/**
 * @openapi
 * /books:
 *   post:
 *     summary: Create a new book
 *     tags: [Books]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/CreateBookDto"
 *     responses:
 *       "201":
 *         description: Book created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Book"
 *       "400":
 *         $ref: "#/components/responses/ValidationError"
 *       "409":
 *         $ref: "#/components/responses/ConflictError"
 *       "500":
 *         $ref: "#/components/responses/InternalError"
 */
export async function createBook(
  req: Request<Record<string, never>, Record<string, never>, CreateBookDto>,
  res: Response,
  next: NextFunction,
) {
  const validation = validateCreateBookDto(req.body);
  if (!validation.valid) {
    return next(
      new AppError("Validation failed", 400, ErrorCodes.VALIDATION_ERROR, validation.details),
    );
  }
  try {
    const book = await BookService.createBook(req.body);
    res.status(201).json(book);
  } catch (error) {
    next(error);
  }
}

/**
 * @openapi
 * /books:
 *   get:
 *     summary: List books with optional filters and pagination
 *     tags: [Books]
 *     parameters:
 *       - name: genre
 *         in: query
 *         schema:
 *           $ref: "#/components/schemas/Genre"
 *       - name: author
 *         in: query
 *         schema:
 *           type: string
 *         description: Case-insensitive partial match
 *       - name: title
 *         in: query
 *         schema:
 *           type: string
 *         description: Case-insensitive partial match
 *       - name: page
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *       - name: limit
 *         in: query
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *     responses:
 *       "200":
 *         description: Paginated list of books
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/PaginatedResponse"
 *       "400":
 *         $ref: "#/components/responses/ValidationError"
 *       "500":
 *         $ref: "#/components/responses/InternalError"
 */
export async function getAllBooks(
  req: Request<Record<string, never>, Record<string, never>, Record<string, never>, BookQueryDto>,
  res: Response,
  next: NextFunction,
) {
  const { genre, author, title, page, limit } = req.query;

  const validation = validateBookQueryDto({ genre, author, title, page, limit });
  if (!validation.valid) {
    return next(
      new AppError("Validation failed", 400, ErrorCodes.VALIDATION_ERROR, validation.details),
    );
  }

  const parsedPage = Number(page ?? DEFAULT_PAGE);
  const parsedLimit = Number(limit ?? DEFAULT_LIMIT);

  const filters: BookQueryDto = {
    genre: genre as Genre | undefined,
    author: author as string | undefined,
    title: title as string | undefined,
    page: parsedPage,
    limit: parsedLimit,
  };

  try {
    const result = await BookService.getAllBooks(filters);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

type GetBookParams = {
  id: string;
};

/**
 * @openapi
 * /books/{id}:
 *   get:
 *     summary: Get a book by id
 *     tags: [Books]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     responses:
 *       "200":
 *         description: Book found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Book"
 *       "400":
 *         $ref: "#/components/responses/ValidationError"
 *       "404":
 *         $ref: "#/components/responses/NotFoundError"
 *       "500":
 *         $ref: "#/components/responses/InternalError"
 */
export async function getBookById(req: Request<GetBookParams>, res: Response, next: NextFunction) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid ID", 400, ErrorCodes.VALIDATION_ERROR));
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

/**
 * @openapi
 * /books/{id}:
 *   patch:
 *     summary: Partially update a book
 *     tags: [Books]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: "#/components/schemas/UpdateBookDto"
 *     responses:
 *       "200":
 *         description: Book updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/Book"
 *       "400":
 *         $ref: "#/components/responses/ValidationError"
 *       "404":
 *         $ref: "#/components/responses/NotFoundError"
 *       "409":
 *         $ref: "#/components/responses/ConflictError"
 *       "500":
 *         $ref: "#/components/responses/InternalError"
 */
export async function updateBook(
  req: Request<UpdateBookParams, Record<string, never>, UpdateBookDto>,
  res: Response,
  next: NextFunction,
) {
  const validation = validateUpdateBookDto(req.body);
  if (!validation.valid) {
    return next(
      new AppError("Validation failed", 400, ErrorCodes.VALIDATION_ERROR, validation.details),
    );
  }
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid ID", 400, ErrorCodes.VALIDATION_ERROR));
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

/**
 * @openapi
 * /books/{id}:
 *   delete:
 *     summary: Delete a book
 *     tags: [Books]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId
 *     responses:
 *       "204":
 *         description: Book deleted successfully
 *       "400":
 *         $ref: "#/components/responses/ValidationError"
 *       "404":
 *         $ref: "#/components/responses/NotFoundError"
 *       "500":
 *         $ref: "#/components/responses/InternalError"
 */
export async function deleteBook(
  req: Request<DeleteBookParams>,
  res: Response,
  next: NextFunction,
) {
  const { id } = req.params;
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return next(new AppError("Invalid ID", 400, ErrorCodes.VALIDATION_ERROR));
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
