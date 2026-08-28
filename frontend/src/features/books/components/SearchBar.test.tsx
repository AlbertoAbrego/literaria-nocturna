import { describe, expect, it, vi } from "vitest";
import SearchBar from "@/features/books/components/SearchBar";
import { fireEvent, renderWithProviders, screen } from "@/test/utils/render";

describe("SearchBar", () => {
  it("renders accessible search inputs for title and author", () => {
    renderWithProviders(
      <SearchBar title="" author="" onTitleChange={vi.fn()} onAuthorChange={vi.fn()} />,
    );

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Author")).toBeInTheDocument();
    expect(screen.getByLabelText("Title")).toHaveAttribute("type", "search");
    expect(screen.getByPlaceholderText("Search by title")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Search by author")).toBeInTheDocument();
  });

  it("reflects the provided filter values", () => {
    renderWithProviders(
      <SearchBar
        title="void"
        author="marchetti"
        onTitleChange={vi.fn()}
        onAuthorChange={vi.fn()}
      />,
    );

    expect(screen.getByLabelText("Title")).toHaveValue("void");
    expect(screen.getByLabelText("Author")).toHaveValue("marchetti");
  });

  it("calls onTitleChange when the title input changes", () => {
    const onTitleChange = vi.fn();
    renderWithProviders(
      <SearchBar title="" author="" onTitleChange={onTitleChange} onAuthorChange={vi.fn()} />,
    );

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "void" } });

    expect(onTitleChange).toHaveBeenCalledWith("void");
  });

  it("calls onAuthorChange when the author input changes", () => {
    const onAuthorChange = vi.fn();
    renderWithProviders(
      <SearchBar title="" author="" onTitleChange={vi.fn()} onAuthorChange={onAuthorChange} />,
    );

    fireEvent.change(screen.getByLabelText("Author"), { target: { value: "mar" } });

    expect(onAuthorChange).toHaveBeenCalledWith("mar");
  });
});
