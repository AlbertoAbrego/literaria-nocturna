export type Genre =
  | "Romance"
  | "Thriller"
  | "Fantasy"
  | "Science Fiction"
  | "Dystopia"
  | "Historical Fiction"
  | "Adventure"
  | "Self Help"
  | "Popular Science"
  | "Horror"
  | "Young Adult"
  | "Children"
  | "Health"
  | "Sports"
  | "Cooking";

export interface UniqueBookData {
  title: string;
  author: string;
  genre: Genre;
  synopsis: string;
}

export function generateUniqueTitle(prefix = "E2E Book"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `${prefix} ${timestamp}-${random}`;
}

export function createUniqueBookData(
  overrides: Partial<UniqueBookData> = {},
): UniqueBookData {
  return {
    title: generateUniqueTitle(),
    author: "Test Author",
    genre: "Horror",
    synopsis: "A test synopsis for E2E verification.",
    ...overrides,
  };
}
