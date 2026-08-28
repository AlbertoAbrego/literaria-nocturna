export const GENRES = [
  "Romance",
  "Thriller",
  "Fantasy",
  "Science Fiction",
  "Dystopia",
  "Historical Fiction",
  "Adventure",
  "Self Help",
  "Popular Science",
  "Horror",
  "Young Adult",
  "Children",
  "Health",
  "Sports",
  "Cooking",
] as const;

export type Genre = (typeof GENRES)[number];
