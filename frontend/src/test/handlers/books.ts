import { http, HttpResponse, type HttpHandler } from "msw";
import type { Book } from "@/test/utils/factories/book.factory";
import {
  validateObjectId,
  validateGenre,
  validatePage,
  validateLimit,
  validateRequiredBody,
  validateEmptyBody,
} from "@/test/contract/validators";
import { ERROR_MESSAGES } from "@/test/contract/error-messages";
import { conflictError, notFoundError, validationError } from "./errors";

function seedBooks(): Book[] {
  return [
    {
      _id: "64f1c2e5a1b2c3d4e5f6a001",
      title: "The Whisper of the Void",
      author: "Isabella Marchetti",
      genre: "Horror",
      synopsis:
        "A scholar discovers that her university library is cataloging books that should not exist.",
      createdAt: "2024-09-01T10:00:00.000Z",
      updatedAt: "2024-09-01T10:00:00.000Z",
      __v: 0,
    },
    {
      _id: "64f1c2e5a1b2c3d4e5f6a002",
      title: "Atlas of Forgotten Stars",
      author: "Jorge Almeida",
      genre: "Science Fiction",
      synopsis:
        "A cartographer charts a constellation that moves in reverse, leading her toward a city that cannot be reached twice.",
      createdAt: "2024-09-02T10:00:00.000Z",
      updatedAt: "2024-09-02T10:00:00.000Z",
      __v: 0,
    },
    {
      _id: "64f1c2e5a1b2c3d4e5f6a003",
      title: "The Sepulchral Garden",
      author: "Marguerite Delacroix",
      genre: "Dystopia",
      synopsis:
        "In a sealed city where memory is rationed, a gardener preserves the last living rose.",
      createdAt: "2024-09-03T10:00:00.000Z",
      updatedAt: "2024-09-03T10:00:00.000Z",
      __v: 0,
    },
    {
      _id: "64f1c2e5a1b2c3d4e5f6a004",
      title: "Letters from the Midnight Archive",
      author: "Theodor Vance",
      genre: "Historical Fiction",
      synopsis:
        "An epistolary account of a Victorian librarian who corresponded with readers who never existed.",
      createdAt: "2024-09-04T10:00:00.000Z",
      updatedAt: "2024-09-04T10:00:00.000Z",
      __v: 0,
    },
    {
      _id: "64f1c2e5a1b2c3d4e5f6a005",
      title: "The Orchard Under the Moon",
      author: "Yuki Tanaka",
      genre: "Fantasy",
      synopsis:
        "A young herbalist inherits an orchard that blooms only during eclipses and bears fruit that grants glimpses of the past.",
      createdAt: "2024-09-05T10:00:00.000Z",
      updatedAt: "2024-09-05T10:00:00.000Z",
      __v: 0,
    },
  ];
}

const books: Book[] = seedBooks();

export function resetBookDb(): void {
  books.length = 0;
  books.push(...seedBooks());
}

function randomId(): string {
  const hex = "0123456789abcdef";
  let id = "";
  for (let i = 0; i < 24; i += 1) {
    id += hex[Math.floor(Math.random() * hex.length)];
  }
  return id;
}

export const bookHandlers: HttpHandler[] = [
  http.get("/api/books", ({ request }) => {
    const url = new URL(request.url);
    const genre = url.searchParams.get("genre");
    const author = url.searchParams.get("author");
    const title = url.searchParams.get("title");
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    const pageValidation = validatePage(pageParam);
    if (!pageValidation.valid) {
      return validationError(ERROR_MESSAGES.INVALID_PAGE);
    }

    const limitValidation = validateLimit(limitParam);
    if (!limitValidation.valid) {
      return validationError(ERROR_MESSAGES.INVALID_LIMIT);
    }

    if (genre && !validateGenre(genre)) {
      return validationError(ERROR_MESSAGES.INVALID_GENRE);
    }

    const page = pageParam ? Number(pageParam) : 1;
    const limit = limitParam ? Number(limitParam) : 10;

    const filtered = books.filter((book) => {
      if (genre && book.genre !== genre) return false;
      if (author && !book.author.toLowerCase().includes(author.toLowerCase())) return false;
      if (title && !book.title.toLowerCase().includes(title.toLowerCase())) return false;
      return true;
    });

    filtered.sort((a, b) => a.title.localeCompare(b.title));

    const total = filtered.length;
    const start = (page - 1) * limit;

    return HttpResponse.json({
      data: filtered.slice(start, start + limit),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  }),

  http.get("/api/books/:id", ({ params }) => {
    if (!validateObjectId(params.id as string)) {
      return validationError(ERROR_MESSAGES.INVALID_ID);
    }

    const book = books.find((candidate) => candidate._id === params.id);
    if (!book) {
      return notFoundError(ERROR_MESSAGES.BOOK_NOT_FOUND);
    }
    return HttpResponse.json(book);
  }),

  http.post("/api/books", async ({ request }) => {
    let body: Partial<Book>;
    try {
      body = (await request.json()) as Partial<Book>;
    } catch {
      return validationError(ERROR_MESSAGES.MISSING_BODY);
    }

    const bodyValidation = validateRequiredBody(body);
    if (!bodyValidation.valid) {
      return validationError(bodyValidation.error!);
    }

    const fieldErrors: Record<string, string> = {};
    if (!body.title) fieldErrors.title = "title is required";
    if (!body.author) fieldErrors.author = "author is required";
    if (!body.genre) fieldErrors.genre = "genre is required";
    if (!body.synopsis) fieldErrors.synopsis = "synopsis is required";

    if (Object.keys(fieldErrors).length > 0) {
      return validationError(ERROR_MESSAGES.VALIDATION_FAILED, fieldErrors);
    }

    if (!validateGenre(body.genre!)) {
      return validationError(ERROR_MESSAGES.VALIDATION_FAILED, { genre: ERROR_MESSAGES.INVALID_GENRE });
    }

    const duplicated = books.some(
      (book) => book.title === body.title && book.author === body.author,
    );
    if (duplicated) {
      return conflictError(ERROR_MESSAGES.BOOK_EXISTS);
    }

    const now = new Date().toISOString();
    const book: Book = {
      _id: randomId(),
      title: body.title!,
      author: body.author!,
      genre: body.genre!,
      synopsis: body.synopsis!,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    };
    books.unshift(book);

    return HttpResponse.json(book, { status: 201 });
  }),

  http.patch("/api/books/:id", async ({ request, params }) => {
    if (!validateObjectId(params.id as string)) {
      return validationError(ERROR_MESSAGES.INVALID_ID);
    }

    const book = books.find((candidate) => candidate._id === params.id);
    if (!book) {
      return notFoundError(ERROR_MESSAGES.BOOK_NOT_FOUND);
    }

    let body: Partial<Book>;
    try {
      body = (await request.json()) as Partial<Book>;
    } catch {
      return validationError(ERROR_MESSAGES.MISSING_BODY);
    }

    const bodyValidation = validateEmptyBody(body);
    if (!bodyValidation.valid) {
      return validationError(bodyValidation.error!);
    }

    if (body.genre !== undefined && !validateGenre(body.genre)) {
      return validationError(ERROR_MESSAGES.VALIDATION_FAILED, { genre: ERROR_MESSAGES.INVALID_GENRE });
    }

    const title = body.title ?? book.title;
    const author = body.author ?? book.author;
    const duplicated = books.some(
      (candidate) =>
        candidate._id !== book._id && candidate.title === title && candidate.author === author,
    );
    if (duplicated) {
      return conflictError(ERROR_MESSAGES.BOOK_EXISTS);
    }

    const updated = { ...book, ...body, title, author, updatedAt: new Date().toISOString() };
    Object.assign(book, updated);

    return HttpResponse.json(updated);
  }),

  http.delete("/api/books/:id", ({ params }) => {
    if (!validateObjectId(params.id as string)) {
      return validationError(ERROR_MESSAGES.INVALID_ID);
    }

    const index = books.findIndex((candidate) => candidate._id === params.id);
    if (index === -1) {
      return notFoundError(ERROR_MESSAGES.BOOK_NOT_FOUND);
    }
    books.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
