import { useNavigate } from "react-router";
import type { Book } from "@/features/books/types";
import Button from "@/shared/components/ui/Button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/shared/components/ui/Table";
import BookTableSkeleton from "@/features/books/components/BookTableSkeleton";
import DeleteBookButton from "@/features/books/components/DeleteBookButton";
import EmptyState from "@/features/books/components/EmptyState";
import ErrorState from "@/features/books/components/ErrorState";

interface BookTableProps {
  books: Book[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error;
  isFiltered?: boolean;
  onRetry?: () => void;
}

const COLUMNS = ["Title", "Author", "Genre", "Synopsis", "Actions"] as const;

function BookTable({ books, isLoading, isError, isFiltered, onRetry }: BookTableProps) {
  const navigate = useNavigate();

  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (!isLoading && books.length === 0) {
    return <EmptyState filtered={isFiltered} />;
  }

  return (
    <>
      {isLoading && (
        <span role="status" className="sr-only">
          Loading the catalog
        </span>
      )}
      <Table aria-label="Book catalog" aria-busy={isLoading}>
        <TableHeader>
          {COLUMNS.map((column) => (
            <TableHead key={column}>{column}</TableHead>
          ))}
        </TableHeader>
        {isLoading ? (
          <BookTableSkeleton />
        ) : (
          <TableBody>
            {books.map((book) => (
              <TableRow key={book._id}>
                <TableCell className="font-medium text-parchment">{book.title}</TableCell>
                <TableCell className="text-fog">{book.author}</TableCell>
                <TableCell className="text-ash">{book.genre}</TableCell>
                <TableCell className="max-w-md truncate text-ash">{book.synopsis}</TableCell>
                <TableCell className="text-right">
                  <span className="inline-flex items-center gap-2">
                    <Button
                      variant="ghost"
                      aria-label={`View details of ${book.title}`}
                      onClick={() => navigate(`/books/${book._id}`)}
                      className="inline-flex items-center gap-1 px-2 py-1 text-xs"
                    >
                      View Details
                    </Button>
                    <DeleteBookButton bookId={book._id} bookTitle={book.title} />
                  </span>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        )}
      </Table>
    </>
  );
}

export default BookTable;
