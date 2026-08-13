import { useState } from "react";
import { useDeleteBook } from "@/features/books/hooks/useDeleteBook";
import { ApiError } from "@/shared/api/errors";
import Button from "@/shared/components/ui/Button";
import ErrorAlert from "@/shared/components/ui/ErrorAlert";
import Modal from "@/shared/components/ui/Modal";

interface DeleteBookButtonProps {
  bookId: string;
  bookTitle?: string;
}

function DeleteBookButton({ bookId, bookTitle }: DeleteBookButtonProps) {
  const [open, setOpen] = useState(false);
  const deleteBook = useDeleteBook();

  function handleConfirm() {
    deleteBook.mutate(bookId, {
      onSuccess: () => setOpen(false),
    });
  }

  function handleError(): string {
    if (deleteBook.error instanceof ApiError) {
      if (deleteBook.error.status === 404) {
        return "This volume no longer exists in the catalog.";
      }
      return deleteBook.error.message;
    }
    return "The archive could not be reached.";
  }

  const title = bookTitle ? `Delete "${bookTitle}"?` : "Delete this book?";
  const label = bookTitle ? `Delete ${bookTitle}` : "Delete book";

  return (
    <>
      <Button
        variant="ghost"
        aria-label={label}
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center p-2"
        title={label}
      >
        <TrashIcon />
        <span className="sr-only">{label}</span>
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title={title}
        description="This action cannot be undone. The volume will be removed from the catalog permanently."
      >
        <div className="mt-6 flex items-center justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => setOpen(false)}
            disabled={deleteBook.isPending}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleConfirm}
            disabled={deleteBook.isPending}
            className="bg-error text-parchment hover:bg-error/80"
          >
            {deleteBook.isPending ? "Deleting..." : "Delete"}
          </Button>
        </div>

        {deleteBook.isError && !deleteBook.isPending && (
          <div className="mt-4">
            <ErrorAlert message={handleError()} />
          </div>
        )}
      </Modal>
    </>
  );
}

function TrashIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" x2="10" y1="11" y2="17" />
      <line x1="14" x2="14" y1="11" y2="17" />
    </svg>
  );
}

export default DeleteBookButton;
