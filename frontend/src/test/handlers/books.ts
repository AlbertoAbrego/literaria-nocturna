import { http, HttpResponse, type HttpHandler } from "msw";
import { GENRES, type Book } from "@/test/utils/factories/book.factory";
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
    const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
    const limit = Math.min(100, Number(url.searchParams.get("limit")) || 10);

    const filtered = books.filter((book) => {
      if (genre && book.genre !== genre) return false;
      if (author && !book.author.toLowerCase().includes(author.toLowerCase())) return false;
      if (title && !book.title.toLowerCase().includes(title.toLowerCase())) return false;
      return true;
    });

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
    const book = books.find((candidate) => candidate._id === params.id);
    if (!book) {
      return notFoundError("Book not found");
    }
    return HttpResponse.json(book);
  }),

  http.post("/api/books", async ({ request }) => {
    const body = (await request.json()) as Partial<Book>;
    if (!body.title || !body.author || !body.genre || !body.synopsis) {
      return validationError("Validation failed", {
        body: "title, author, genre and synopsis are required",
      });
    }
    if (!GENRES.includes(body.genre)) {
      return validationError("Validation failed", { genre: "Invalid genre" });
    }

    const duplicated = books.some(
      (book) => book.title === body.title && book.author === body.author,
    );
    if (duplicated) {
      return conflictError("Book already exists.");
    }

    const now = new Date().toISOString();
    const book: Book = {
      _id: randomId(),
      title: body.title,
      author: body.author,
      genre: body.genre,
      synopsis: body.synopsis,
      createdAt: now,
      updatedAt: now,
      __v: 0,
    };
    books.unshift(book);

    return HttpResponse.json(book, { status: 201 });
  }),

  http.patch("/api/books/:id", async ({ request, params }) => {
    const book = books.find((candidate) => candidate._id === params.id);
    if (!book) {
      return notFoundError("Book not found");
    }

    const body = (await request.json()) as Partial<Book>;
    const title = body.title ?? book.title;
    const author = body.author ?? book.author;
    const duplicated = books.some(
      (candidate) =>
        candidate._id !== book._id && candidate.title === title && candidate.author === author,
    );
    if (duplicated) {
      return conflictError("Book already exists.");
    }

    const updated = { ...book, ...body, title, author, updatedAt: new Date().toISOString() };
    Object.assign(book, updated);

    return HttpResponse.json(updated);
  }),

  http.delete("/api/books/:id", ({ params }) => {
    const index = books.findIndex((candidate) => candidate._id === params.id);
    if (index === -1) {
      return notFoundError("Book not found");
    }
    books.splice(index, 1);
    return new HttpResponse(null, { status: 204 });
  }),
];
