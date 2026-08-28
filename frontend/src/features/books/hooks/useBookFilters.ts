import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router";
import type { BooksQueryParams, Genre, SearchFilters } from "@/features/books/types";
import {
  buildSearchParams,
  DEBOUNCE_MS,
  EMPTY_SEARCH_FILTERS,
  filtersEqual,
  parsePage,
  parseSearchFilters,
  toBooksQueryParams,
} from "@/features/books/utils/searchFilters";

export function useBookFilters() {
  const [searchParams, setSearchParams] = useSearchParams();
  const committed = useMemo(() => parseSearchFilters(searchParams), [searchParams]);
  const page = useMemo(() => parsePage(searchParams), [searchParams]);
  const [draft, setDraft] = useState<SearchFilters>(committed);
  const [previousCommitted, setPreviousCommitted] = useState<SearchFilters>(committed);

  if (!filtersEqual(previousCommitted, committed)) {
    setPreviousCommitted(committed);
    setDraft(committed);
  }

  useEffect(() => {
    if (filtersEqual(draft, committed)) return;
    const timer = setTimeout(() => {
      setSearchParams(buildSearchParams(draft), { replace: true });
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [draft, committed, setSearchParams]);

  function setTitle(title: string) {
    setDraft((current) => ({ ...current, title }));
  }

  function setAuthor(author: string) {
    setDraft((current) => ({ ...current, author }));
  }

  function setGenre(genre: Genre | "") {
    setDraft((current) => ({ ...current, genre }));
  }

  function resetFilters() {
    setDraft(EMPTY_SEARCH_FILTERS);
  }

  function setPage(next: number) {
    const safe = Math.max(1, Math.floor(next));
    if (safe === page) return;
    setSearchParams(buildSearchParams(committed, safe), { replace: true });
  }

  function adjustPageAfterDeletion(totalPages: number) {
    const safePage = Math.min(page, Math.max(1, totalPages));
    if (safePage !== page) {
      setSearchParams(buildSearchParams(committed, safePage), { replace: true });
    }
  }

  const queryParams = useMemo<BooksQueryParams>(
    () => toBooksQueryParams(committed, page),
    [committed, page],
  );
  const isFiltered = Boolean(committed.title || committed.author || committed.genre);

  return {
    title: draft.title,
    author: draft.author,
    genre: draft.genre,
    setTitle,
    setAuthor,
    setGenre,
    resetFilters,
    page,
    setPage,
    adjustPageAfterDeletion,
    queryParams,
    isFiltered,
  };
}
