import { describe, expect, it, vi } from "vitest";
import { BookTable } from "@/features/books/components";
import { createBookList } from "@/test/utils/factories/book.factory";
import { renderWithProviders, screen, userEvent } from "@/test/utils/render";

describe("BookTable", () => {
  it("renders books in the table", () => {
    const books = createBookList(2);
    books[0] = { ...books[0], title: "The Unquiet Archive", author: "Ada Lovelace" };
    books[1] = { ...books[1], synopsis: "A catalog of doors that open only once." };

    renderWithProviders(<BookTable books={books} />);

    expect(screen.getByRole("table", { name: "Book catalog" })).toBeInTheDocument();
    expect(screen.getByText("The Unquiet Archive")).toBeInTheDocument();
    expect(screen.getByText("Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText(books[1].title)).toBeInTheDocument();
    expect(screen.getByText(books[1].synopsis)).toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(3);
  });

  it("renders the table headers", () => {
    renderWithProviders(<BookTable books={createBookList(1)} />);

    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    for (const column of ["Title", "Author", "Genre", "Synopsis", "Actions"]) {
      expect(screen.getByRole("columnheader", { name: column })).toBeInTheDocument();
    }
  });

  it("displays the empty state when there are no books", () => {
    renderWithProviders(<BookTable books={[]} />);

    const emptyMessage = screen.getByText(
      (_content, element) =>
        element?.tagName === "P" &&
        element.textContent?.includes("No volumes have been cataloged yet.") === true,
    );
    expect(emptyMessage).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("displays a contextual empty state when filters produce no matches", () => {
    renderWithProviders(<BookTable books={[]} isFiltered />);

    const emptyMessage = screen.getByText(
      (_content, element) =>
        element?.tagName === "P" &&
        element.textContent?.includes("No volumes match the current search.") === true,
    );
    expect(emptyMessage).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("displays skeleton rows while loading", () => {
    renderWithProviders(<BookTable books={[]} isLoading />);

    expect(screen.getByRole("status")).toHaveTextContent("Loading the catalog");
    expect(screen.getByRole("table")).toHaveAttribute("aria-busy", "true");
    expect(screen.getAllByRole("row")).toHaveLength(6);
  });

  it("displays the error state and triggers retry", async () => {
    const onRetry = vi.fn();

    renderWithProviders(<BookTable books={[]} isError onRetry={onRetry} />);

    expect(screen.getByRole("alert")).toHaveTextContent("The archive could not be reached.");

    await userEvent.click(screen.getByRole("button", { name: "Retry" }));
    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it("exposes accessible table semantics", () => {
    renderWithProviders(<BookTable books={createBookList(1)} />);

    expect(screen.getByRole("table", { name: "Book catalog" })).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader")).toHaveLength(5);
    expect(screen.getAllByRole("row")).toHaveLength(2);
  });
});
