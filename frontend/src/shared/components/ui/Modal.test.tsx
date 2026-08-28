import { useState } from "react";
import { describe, expect, it } from "vitest";
import { renderWithProviders, screen, userEvent } from "@/test/utils/render";
import Modal from "./Modal";

function ModalHarness() {
  const [open, setOpen] = useState(false);
  return (
    <div>
      <button type="button" onClick={() => setOpen(true)}>
        Open modal
      </button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Delete book"
        description="This cannot be undone."
      >
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button">Delete</button>
        </div>
      </Modal>
    </div>
  );
}

async function openModal() {
  await userEvent.click(screen.getByRole("button", { name: "Open modal" }));
}

describe("Modal", () => {
  it("does not render when closed", () => {
    renderWithProviders(<ModalHarness />);

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("renders the dialog with title and description when opened", async () => {
    renderWithProviders(<ModalHarness />);
    await openModal();

    const dialog = screen.getByRole("dialog", { name: "Delete book" });
    expect(dialog).toHaveAttribute("aria-modal", "true");
    expect(screen.getByText("This cannot be undone.")).toBeInTheDocument();
  });

  it("closes when the backdrop is clicked", async () => {
    renderWithProviders(<ModalHarness />);
    await openModal();

    await userEvent.click(screen.getByTestId("modal-overlay"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("closes when Escape is pressed", async () => {
    renderWithProviders(<ModalHarness />);
    await openModal();

    await userEvent.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("moves focus into the dialog when opened", async () => {
    renderWithProviders(<ModalHarness />);
    await openModal();

    expect(screen.getByRole("button", { name: "Cancel" })).toHaveFocus();
  });

  it("restores focus to the trigger when closed", async () => {
    renderWithProviders(<ModalHarness />);
    const openButton = screen.getByRole("button", { name: "Open modal" });

    await userEvent.click(openButton);
    await userEvent.keyboard("{Escape}");

    expect(openButton).toHaveFocus();
  });

  it("traps focus within the dialog", async () => {
    renderWithProviders(<ModalHarness />);
    await openModal();

    const cancel = screen.getByRole("button", { name: "Cancel" });
    const deleteButton = screen.getByRole("button", { name: "Delete" });

    expect(cancel).toHaveFocus();

    await userEvent.tab();
    expect(deleteButton).toHaveFocus();

    await userEvent.tab();
    expect(cancel).toHaveFocus();

    await userEvent.tab({ shift: true });
    expect(deleteButton).toHaveFocus();
  });
});
