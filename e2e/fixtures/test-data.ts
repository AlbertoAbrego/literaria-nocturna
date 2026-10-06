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

function getRunId(): string {
  return process.env.E2E_RUN_ID || "local";
}

export function getE2ERunId(): string {
  return getRunId();
}

export function generateUniqueTitle(prefix = "E2E Book"): string {
  const runId = getRunId();
  const timestamp = Date.now();
  const random = Math.random().toString(36).slice(2, 8);
  return `E2E:${runId}:${prefix} ${timestamp}-${random}`;
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

export function isE2EOwned(title: string): boolean {
  return /^E2E:[a-z0-9]+:/.test(title);
}

export function extractRunId(title: string): string | null {
  const match = title.match(/^E2E:([a-z0-9]+):/);
  return match ? match[1] : null;
}
