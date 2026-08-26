import { Genre } from "../../models/book.model";
import type { Book } from "../../models/book.model";
import type { CreateBookDto } from "../../dto/book/create-book.dto";

let bookCounter = 0;

function nextTitle(): string {
  bookCounter += 1;
  return `Book ${bookCounter}`;
}

function nextAuthor(): string {
  return `Author ${bookCounter}`;
}

export function createBookDto(overrides: Partial<CreateBookDto> = {}): CreateBookDto {
  return {
    title: nextTitle(),
    author: nextAuthor(),
    genre: Genre.Fantasy,
    synopsis: "Un piloto se encuentra a un pequeño príncipe en el desierto.",
    ...overrides,
  };
}

export function createBookModel(overrides: Partial<Book> = {}): Book {
  return {
    ...createBookDto(overrides),
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  };
}

export function resetBookCounter(): void {
  bookCounter = 0;
}
