import { GENRES, type Genre } from "@/features/books/types";

export { GENRES, type Genre };

export type Book = {
  _id: string;
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
};

export type CreateBookInput = {
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
};

let counter = 0;

function createId(): string {
  return `64f1c2e5a1b2c3d4e5f6${String(counter).padStart(4, "0")}`;
}

export function createBook(overrides: Partial<Book> = {}): Book {
  counter += 1;
  const timestamp = "2024-01-01T00:00:00.000Z";
  return {
    _id: createId(),
    title: `The Unseen Volume ${counter}`,
    author: "Anonymous Scribe",
    genre: "Horror",
    synopsis: "A volume that should never have been cataloged.",
    createdAt: timestamp,
    updatedAt: timestamp,
    __v: 0,
    ...overrides,
  };
}

export function createBookList(count: number, overrides: Partial<Book> = {}): Book[] {
  return Array.from({ length: count }, () => createBook(overrides));
}

export function createBookFormData(overrides: Partial<CreateBookInput> = {}): CreateBookInput {
  counter += 1;
  return {
    title: `The Unseen Volume ${counter}`,
    author: "Anonymous Scribe",
    genre: "Horror",
    synopsis: "A volume that should never have been cataloged.",
    ...overrides,
  };
}

export function updateBookFormData(overrides: Partial<CreateBookInput> = {}): CreateBookInput {
  counter += 1;
  return {
    title: `The Revised Volume ${counter}`,
    author: "Anonymous Scribe",
    genre: "Horror",
    synopsis: "A volume that should never have been cataloged.",
    ...overrides,
  };
}
