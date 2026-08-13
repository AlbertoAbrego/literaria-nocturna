import { describe, expect, it } from "vitest";
import { BookDetails, BookDetailsNotFound, BookDetailsSkeleton } from "@/features/books/components";
import { createBook } from "@/test/utils/factories/book.factory";
import { renderWithProviders, screen } from "@/test/utils/render";

describe("BookDetails", () => {
  it("renders all book fields", () => {
    const book = createBook({
      title: "The Unquiet Archive",
      author: "Ada Lovelace",
      genre: "Science Fiction",
      synopsis: "A catalog of doors that open only once.",
    });

    renderWithProviders(<BookDetails book={book} />, { route: "/books" });

    expect(screen.getByRole("heading", { level: 1, name: book.title })).toBeInTheDocument();
    expect(screen.getByText("by Ada Lovelace")).toBeInTheDocument();
    expect(screen.getByText("Science Fiction")).toBeInTheDocument();
    expect(screen.getByText(book.synopsis)).toBeInTheDocument();
  });

  it("renders the cataloged and updated timestamps", () => {
    const book = createBook({ createdAt: "2024-01-05T10:00:00.000Z", updatedAt: "2024-02-10T10:00:00.000Z" });

    renderWithProviders(<BookDetails book={book} />, { route: "/books" });

    expect(screen.getByText("Cataloged")).toBeInTheDocument();
    expect(screen.getByText("Last updated")).toBeInTheDocument();
    expect(screen.getByText(new Date(book.createdAt).toLocaleDateString())).toBeInTheDocument();
    expect(screen.getByText(new Date(book.updatedAt).toLocaleDateString())).toBeInTheDocument();
  });

  it("provides a link back to the book list", () => {
    const book = createBook();

    renderWithProviders(<BookDetails book={book} />, { route: "/books" });

    expect(screen.getByRole("link", { name: /back to catalog/i })).toHaveAttribute("href", "/books");
  });

  it("provides a link to edit the volume", () => {
    const book = createBook();

    renderWithProviders(<BookDetails book={book} />, { route: "/books" });

    expect(screen.getByRole("link", { name: /edit this volume/i })).toHaveAttribute(
      "href",
      `/books/${book._id}/edit`,
    );
  });

  it("exposes accessible semantics", () => {
    const book = createBook({ title: "The Accessible Grimoire" });

    renderWithProviders(<BookDetails book={book} />, { route: "/books" });

    expect(screen.getByRole("article")).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 1, name: book.title })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /back to catalog/i })).toBeInTheDocument();
  });
});

describe("BookDetailsSkeleton", () => {
  it("renders a skeleton copy of the details layout", () => {
    const { container } = renderWithProviders(<BookDetailsSkeleton />);

    expect(container.querySelector('[aria-hidden="true"]')).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-pulse").length).toBeGreaterThan(0);
  });
});

describe("BookDetailsNotFound", () => {
  it("renders the literary not-found message", () => {
    renderWithProviders(<BookDetailsNotFound />, { route: "/books" });

    expect(screen.getByText("This volume does not exist in the catalog.")).toBeInTheDocument();
  });

  it("provides a link back to the book list", () => {
    renderWithProviders(<BookDetailsNotFound />, { route: "/books" });

    expect(screen.getByRole("link", { name: /back to the catalog/i })).toHaveAttribute("href", "/books");
  });
});