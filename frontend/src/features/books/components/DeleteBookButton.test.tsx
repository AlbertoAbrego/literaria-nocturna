import { HttpResponse, http } from "msw";
import { describe, expect, it, vi } from "vitest";
import { DeleteBookButton } from "@/features/books/components";
import { renderWithProviders, screen, userEvent, waitFor, act } from "@/test/utils/render";
import { server } from "@/test/server";
import { internalError } from "@/test/handlers/errors";

const SEED_BOOK_ID = "64f1c2e5a1b2c3d4e5f6a001";

async function openModal() {
  await userEvent.click(screen.getByRole("button", { name: "Delete The Whisper of the Void" }));
}

describe("DeleteBookButton", () => {
  it("renders a delete button with an accessible label", () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);

    expect(screen.getByRole("button", { name: "Delete The Whisper of the Void" })).toBeInTheDocument();
  });

  it("opens the confirmation modal on click", async () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    await openModal();

    expect(screen.getByRole("dialog", { name: 'Delete "The Whisper of the Void"?' })).toBeInTheDocument();
  });

  it("closes the modal when cancelled without deleting", async () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    await openModal();

    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal when the backdrop is clicked", async () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    await openModal();

    await userEvent.click(screen.getByTestId("modal-overlay"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes the modal when Escape is pressed", async () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    await openModal();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("restores focus to the trigger button after the modal closes", async () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    const trigger = screen.getByRole("button", { name: "Delete The Whisper of the Void" });

    await userEvent.click(trigger);
    await userEvent.keyboard("{Escape}");

    expect(trigger).toHaveFocus();
  });

  it("falls back to a generic label and title when the book title is absent", async () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} />);
    await userEvent.click(screen.getByRole("button", { name: "Delete book" }));

    expect(screen.getByRole("dialog", { name: "Delete this book?" })).toBeInTheDocument();
  });

  it("deletes the book when the user confirms and closes the modal", async () => {
    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    await openModal();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("disables the action buttons and shows a pending label during deletion", async () => {
    let resolveRequest: (value: HttpResponse<null>) => void;
    server.use(
      http.delete("/api/books/:id", () =>
        new Promise<HttpResponse<null>>((resolve) => {
          resolveRequest = resolve;
        }),
      ),
    );

    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    await openModal();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    const pendingButton = await screen.findByRole("button", { name: "Deleting..." });
    expect(pendingButton).toBeDisabled();
    expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

    await act(async () => {
      resolveRequest(new HttpResponse(null, { status: 204 }));
    });

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
  });

  it("shows an inline error and keeps the modal open when deletion fails", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    server.use(http.delete("/api/books/:id", () => internalError()));

    renderWithProviders(<DeleteBookButton bookId={SEED_BOOK_ID} bookTitle="The Whisper of the Void" />);
    await openModal();

    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Internal server error");
    expect(screen.getByRole("dialog")).toBeInTheDocument();
  });

  it("shows a not-found message when the book is already gone", async () => {
    renderWithProviders(<DeleteBookButton bookId="64f1c2e5a1b2c3d4e5f6a999" bookTitle="The Lost Volume" />);
    await userEvent.click(screen.getByRole("button", { name: "Delete The Lost Volume" }));
    await userEvent.click(screen.getByRole("button", { name: "Delete" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This volume no longer exists in the catalog.",
    );
  });
});