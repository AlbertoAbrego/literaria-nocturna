import { Genre } from "../../models/book.model";
import type { Book } from "../../models/book.model";
import type { CreateBookDto } from "../../dto/book/create-book.dto";

export function createBookDto(overrides: Partial<CreateBookDto> = {}): CreateBookDto {
  return {
    title: "El Principito",
    author: "Antoine de Saint-Exupéry",
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
