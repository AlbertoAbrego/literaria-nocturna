import { describe, expect, it, vi } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/utils/render";
import Pagination from "./Pagination";

describe("Pagination", () => {
  it("does not render when there is only one page", () => {
    renderWithProviders(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );

    expect(screen.queryByRole("navigation")).not.toBeInTheDocument();
  });

  it("renders page numbers and navigation buttons", () => {
    renderWithProviders(
      <Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole("navigation", { name: "Pagination" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Previous" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Next" })).toBeInTheDocument();
    for (const page of [1, 2, 3, 4, 5]) {
      expect(screen.getByRole("button", { name: `Go to page ${page}` })).toBeInTheDocument();
    }
  });

  it("marks the current page with aria-current", () => {
    renderWithProviders(
      <Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />,
    );

    const current = screen.getByRole("button", { name: "Go to page 3" });
    expect(current).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("button", { name: "Go to page 2" })).not.toHaveAttribute(
      "aria-current",
    );
  });

  it("disables the previous button on the first page", () => {
    renderWithProviders(
      <Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeEnabled();
  });

  it("disables the next button on the last page", () => {
    renderWithProviders(
      <Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Previous" })).toBeEnabled();
  });

  it("collapses page ranges with ellipses when there are many pages", () => {
    renderWithProviders(
      <Pagination currentPage={5} totalPages={10} onPageChange={vi.fn()} />,
    );

    expect(screen.getByRole("button", { name: "Go to page 1" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to page 10" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Go to page 5" })).toBeInTheDocument();
    expect(screen.getAllByText("…")).toHaveLength(2);
  });

  it("calls onPageChange with the clicked page number", async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Go to page 4" }));

    expect(onPageChange).toHaveBeenCalledTimes(1);
    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("calls onPageChange when navigating to the previous page", async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Previous" }));

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("calls onPageChange when navigating to the next page", async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />,
    );

    await userEvent.click(screen.getByRole("button", { name: "Next" }));

    expect(onPageChange).toHaveBeenCalledWith(4);
  });

  it("triggers onPageChange when the focused page button is activated with the keyboard", async () => {
    const onPageChange = vi.fn();
    renderWithProviders(
      <Pagination currentPage={1} totalPages={5} onPageChange={onPageChange} />,
    );

    const pageTwo = screen.getByRole("button", { name: "Go to page 2" });
    pageTwo.focus();
    await userEvent.keyboard("{Enter}");

    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it("moves focus between controls with the arrow keys", async () => {
    renderWithProviders(
      <Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} />,
    );

    const pageTwo = screen.getByRole("button", { name: "Go to page 2" });
    pageTwo.focus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveFocus();

    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("button", { name: "Go to page 4" })).toHaveFocus();

    await userEvent.keyboard("{ArrowLeft}");
    expect(screen.getByRole("button", { name: "Go to page 3" })).toHaveFocus();
  });

  it("disables every control while loading", async () => {
    renderWithProviders(
      <Pagination currentPage={3} totalPages={5} onPageChange={vi.fn()} isLoading />,
    );

    expect(screen.getByRole("button", { name: "Previous" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Next" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Go to page 3" })).toBeDisabled();
  });
});