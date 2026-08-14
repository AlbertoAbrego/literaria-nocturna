import { describe, expect, it, vi } from "vitest";
import { GENRES } from "@/features/books/types";
import GenreFilter from "@/features/books/components/GenreFilter";
import { renderWithProviders, screen, userEvent } from "@/test/utils/render";

describe("GenreFilter", () => {
  it("renders the All Genres option alongside every genre", () => {
    renderWithProviders(<GenreFilter value="" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Genre")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(GENRES.length + 1);
    expect(screen.getByRole("option", { name: "All Genres" })).toBeInTheDocument();
  });

  it("reflects the selected genre", () => {
    renderWithProviders(<GenreFilter value="Horror" onChange={vi.fn()} />);

    expect(screen.getByLabelText("Genre")).toHaveValue("Horror");
  });

  it("calls onChange with the selected genre", async () => {
    const onChange = vi.fn();
    renderWithProviders(<GenreFilter value="" onChange={onChange} />);

    await userEvent.selectOptions(screen.getByLabelText("Genre"), "Horror");

    expect(onChange).toHaveBeenCalledWith("Horror");
  });

  it("calls onChange with an empty string when All Genres is selected", async () => {
    const onChange = vi.fn();
    renderWithProviders(<GenreFilter value="Horror" onChange={onChange} />);

    await userEvent.selectOptions(
      screen.getByLabelText("Genre"),
      screen.getByRole("option", { name: "All Genres" }),
    );

    expect(onChange).toHaveBeenCalledWith("");
  });
});