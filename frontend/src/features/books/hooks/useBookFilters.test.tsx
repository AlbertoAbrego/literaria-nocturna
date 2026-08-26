import { describe, expect, it } from "vitest";
import { useLocation } from "react-router";
import { useBookFilters } from "@/features/books/hooks/useBookFilters";
import { renderWithProviders, screen, userEvent, waitFor } from "@/test/utils/render";
import {
  buildSearchParams,
  escapeRegex,
  parsePage,
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
      <span data-testid="page">{filters.page}</span>
      <span data-testid="query-params">{JSON.stringify(filters.queryParams)}</span>
      <span data-testid="is-filtered">{String(filters.isFiltered)}</span>
      <input data-testid="title-input" value={filters.title} onChange={(e) => filters.setTitle(e.target.value)} />
      <input data-testid="author-input" value={filters.author} onChange={(e) => filters.setAuthor(e.target.value)} />
      <button onClick={() => filters.setTitle("void")}>search-void</button>
      <button onClick={() => filters.setAuthor("marchetti")}>author-marchetti</button>
      <button onClick={() => filters.setGenre("Horror")}>genre-horror</button>
      <button onClick={() => filters.setPage(3)}>page-3</button>
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

  it("initializes the page from the URL", () => {
    renderWithProviders(<FilterHarness />, { route: "/books?title=void&page=3" });

    expect(screen.getByTestId("page")).toHaveTextContent("3");
    expect(screen.getByTestId("query-params")).toHaveTextContent(
      JSON.stringify({ title: "void", page: 3 }),
    );
  });

  it("defaults the page to 1 when absent from the URL", () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    expect(screen.getByTestId("page")).toHaveTextContent("1");
    expect(screen.getByTestId("query-params")).toHaveTextContent(
      JSON.stringify({}),
    );
  });

  it("updates the URL immediately when the page changes", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    await userEvent.click(screen.getByRole("button", { name: "page-3" }));

    await waitFor(() => expect(screen.getByTestId("search")).toHaveTextContent("?page=3"));
    expect(screen.getByTestId("page")).toHaveTextContent("3");
    expect(screen.getByTestId("query-params")).toHaveTextContent(
      JSON.stringify({ page: 3 }),
    );
  });

  it("resets the page to 1 when a search filter is applied", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books?title=x&page=3" });

    expect(screen.getByTestId("page")).toHaveTextContent("3");

    await userEvent.click(screen.getByRole("button", { name: "search-void" }));

    await waitFor(() => {
      expect(screen.getByTestId("search")).toHaveTextContent("?title=void");
      expect(screen.getByTestId("page")).toHaveTextContent("1");
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

  it("omits the page param when it is the first page", () => {
    expect(buildSearchParams({ title: "void", author: "", genre: "" }, 1).toString()).toBe(
      "title=void",
    );
  });

  it("includes the page param when it is greater than the first page", () => {
    expect(buildSearchParams({ title: "void", author: "", genre: "" }, 3).toString()).toBe(
      "title=void&page=3",
    );
  });

  it("parses a valid page from the URL", () => {
    expect(parsePage(new URLSearchParams("page=4"))).toBe(4);
  });

  it("defaults the page to 1 when absent", () => {
    expect(parsePage(new URLSearchParams(""))).toBe(1);
  });

  it("clamps an invalid page to 1", () => {
    expect(parsePage(new URLSearchParams("page=0"))).toBe(1);
    expect(parsePage(new URLSearchParams("page=bogus"))).toBe(1);
    expect(parsePage(new URLSearchParams("page=-2"))).toBe(1);
  });

  it("includes the page in derived query params when greater than 1", () => {
    expect(toBooksQueryParams({ title: "", author: "", genre: "" }, 3)).toEqual({
      page: 3,
    });
  });
});

describe("escapeRegex utility", () => {
  // These are the regex metacharacters that need escaping in JavaScript regex
  // Note: '-' is not included as it's only special inside character classes
  const specialChars = [".", "?", "(", ")", "[", "]", "{", "}", "|", "^", "$", "\\"];

  it.each(specialChars)("escapes special character '%s'", (char) => {
    const input = `test${char}input`;
    const escaped = escapeRegex(input);
    expect(escaped).toBe(`test\\${char}input`);
  });

  it("escapes multiple special characters", () => {
    const input = "test.(book)?";
    const escaped = escapeRegex(input);
    expect(escaped).toBe("test\\.\\(book\\)\\?");
  });

  it("handles empty string", () => {
    expect(escapeRegex("")).toBe("");
  });

  it("handles string without special characters", () => {
    expect(escapeRegex("normal text")).toBe("normal text");
  });

  it("does not escape hyphen (not a regex metacharacter outside character class)", () => {
    expect(escapeRegex("test-input")).toBe("test-input");
  });
});

describe("search special characters in filters", () => {
  it("special characters in title search don't break requests", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    await userEvent.type(screen.getByTestId("title-input") ?? screen.getByRole("textbox", { name: /title/i }), "Test.Book");

    await waitFor(() => {
      expect(screen.getByTestId("search")).toHaveTextContent("title=Test.Book");
    });
  });

  it("special characters in author search don't break requests", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    await userEvent.type(screen.getByTestId("author-input") ?? screen.getByRole("textbox", { name: /author/i }), "Author-One");

    await waitFor(() => {
      expect(screen.getByTestId("search")).toHaveTextContent("author=Author-One");
    });
  });

  it("special characters in genre filter don't break requests", async () => {
    renderWithProviders(<FilterHarness />, { route: "/books" });

    await userEvent.click(screen.getByRole("button", { name: "genre-horror" }));

    await waitFor(() => {
      expect(screen.getByTestId("search")).toHaveTextContent("genre=Horror");
    });
  });
});