import { describe, expect, it, vi } from "vitest";
import type { Genre } from "@/features/books/types";
import FilterBar from "@/features/books/components/FilterBar";
import { fireEvent, renderWithProviders, screen, userEvent } from "@/test/utils/render";

interface FilterBarTestProps {
  isFiltered?: boolean;
  onReset?: () => void;
  onTitleChange?: (value: string) => void;
  onGenreChange?: (value: Genre | "") => void;
}

function renderFilterBar(overrides: FilterBarTestProps = {}) {
  const props = {
    title: "void",
    author: "marchetti",
    genre: "Horror" as Genre,
    onTitleChange: vi.fn(),
    onAuthorChange: vi.fn(),
    onGenreChange: vi.fn(),
    onReset: vi.fn(),
    isFiltered: true,
    ...overrides,
  };
  renderWithProviders(<FilterBar {...props} />);
  return props;
}

describe("FilterBar", () => {
  it("composes the search inputs and the genre filter", () => {
    renderFilterBar();

    expect(screen.getByLabelText("Title")).toBeInTheDocument();
    expect(screen.getByLabelText("Author")).toBeInTheDocument();
    expect(screen.getByLabelText("Genre")).toBeInTheDocument();
  });

  it("calls onReset when Clear filters is clicked", async () => {
    const onReset = vi.fn();
    renderFilterBar({ onReset });

    await userEvent.click(screen.getByRole("button", { name: "Clear filters" }));

    expect(onReset).toHaveBeenCalled();
  });

  it("hides Clear filters when no filters are active", () => {
    renderFilterBar({ isFiltered: false });

    expect(screen.queryByRole("button", { name: "Clear filters" })).not.toBeInTheDocument();
  });

  it("propagates filter changes through the composed controls", async () => {
    const onTitleChange = vi.fn();
    const onGenreChange = vi.fn();
    renderFilterBar({ onTitleChange, onGenreChange });

    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "new" } });
    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Fantasy");

    expect(onTitleChange).toHaveBeenCalledWith("new");
    expect(onGenreChange).toHaveBeenCalledWith("Fantasy");
  });
});
