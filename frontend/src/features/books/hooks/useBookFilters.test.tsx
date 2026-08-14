import { describe, expect, it } from "vitest";
import { useLocation } from "react-router";
import { useBookFilters } from "@/features/books/hooks/useBookFilters";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";
import {
  buildSearchParams,
  parseSearchFilters,
  toBooksQueryParams,
} from "@/features/books/utils/searchFilters";

function FilterHarness() {
  const filters = useBookFilters();
  const location = useLocation();

  return (
    <div>
      <span data-testid="search">{location.search}</span>
      <span data-testid="title">{filters.title}</span>
      <span data-testid="author">{filters.author}</span>
      <span data-testid="genre">{filters.genre}</span>
      <span data-testid="query-params">{JSON.stringify(filters.queryParams)}</span>
      <span data-testid="is-filtered">{String(filters.isFiltered)}</span>
      <button onClick={() => filters.setTitle("void")}>search-void</button>
      <button onClick={() => filters.setAuthor("marchetti")}>author-marchetti</button>
      <button onClick={() => filters.setGenre("Horror")}>genre-horror</button>
      <button onClick={filters.resetFilters}>reset</button>
    </div>
  );
}

describe("useBookFilters", () => {
  it("initializes filter state from URL query params", () => {
    renderWithProviders(<FilterHarness />, {
      route: "/books?title=void&author=marchetti&genre=Horror",
    });

    expect(screen.getByTestId("title")).toHaveTextContent("void");
    expect(screen.getByTestId("author")).toHaveTextContent("marchetti");
    expect(screen.getByTestId("genre")).toHaveTextContent("Horror");
    expect(screen.getByTestId("is-filtered")).toHaveTextContent("true");
    expect(screen.getByTestId("query-params")).toHaveTextContent(
      JSON.stringify({ title: "void", author: "marchetti", genre: "Horror" }),
    );
  });

  it("ignores an invalid genre in the URL", () => {
    renderWithProviders(<FilterHarness />, { route: "/books?genre=Bogus" });

    expect(screen.getByTestId("genre")).toHaveTextContent("");
    expect(screen.getByTestId("is-filtered")).toHaveTextContent("false");
  });

  it("updates filter state immediately on change, before the URL is synced", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    await userEvent.click(screen.getByRole("button", { name: "search-void" }));

    expect(screen.getByTestId("title")).toHaveTextContent("void");
    expect(screen.getByTestId("search")).toHaveTextContent("");
  });

  it("debounces the URL update for search input", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    await userEvent.click(screen.getByRole("button", { name: "search-void" }));

    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent("?title=void"));
  });

  it("synchronizes all filter fields to the URL after debounce", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    await userEvent.click(screen.getByRole("button", { name: "search-void" }));
    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent("?title=void"));

    await userEvent.click(screen.getByRole("button", { name: "author-marchetti" }));
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent("?title=void&author=marchetti"),
    );

    await userEvent.click(screen.getByRole("button", { name: "genre-horror" }));
    await waitFor(() =>
      expect(screen.getByTestId("search")).toHaveTextContent(
        "?title=void&author=marchetti&genre=Horror",
      ),
    );

    expect(screen.getByTestId("query-params")).toHaveTextContent(
      JSON.stringify({ title: "void", author: "marchetti", genre: "Horror" }),
    );
  });

  it("resets filters and clears the URL", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books?title=void&genre=Horror" });

    expect(screen.getByTestId("title")).toHaveTextContent("void");

    await userEvent.click(screen.getByRole("button", { name: "reset" }));

    expect(screen.getByTestId("title")).toHaveTextContent("");
    expect(screen.getByTestId("genre")).toHaveTextContent("");

    await waitFor(() => {
      expect(screen.getByTestId("search")).toHaveTextContent("");
      expect(screen.getByTestId("is-filtered")).toHaveTextContent("false");
    });
  });
});

describe("searchFilters utils", () => {
  it("parses URL params into search filters", () => {
    expect(parseSearchFilters(new URLSearchParams("title=void&author=marchetti&genre=Horror"))).toEqual({
      title: "void",
      author: "marchetti",
      genre: "Horror",
    });
  });

  it("rejects an invalid genre when parsing", () => {
    expect(parseSearchFilters(new URLSearchParams("genre=Bogus")).genre).toBe("");
  });

  it("derives query params omitting empty filters", () => {
    expect(toBooksQueryParams({ title: "", author: "marchetti", genre: "" })).toEqual({
      author: "marchetti",
    });
  });

  it("trims title and author when deriving query params", () => {
    expect(toBooksQueryParams({ title: "  void  ", author: "", genre: "" })).toEqual({
      title: "void",
    });
  });

  it("builds search params only from non-empty filters", () => {
    expect(buildSearchParams({ title: "void", author: "", genre: "Horror" }).toString()).toBe(
      "title=void&genre=Horror",
    );
  });
});