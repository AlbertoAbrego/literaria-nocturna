import type { Book } from "@/features/books/types";
import BookTableSkeleton from "@/features/books/components/BookTableSkeleton";
import EmptyState from "@/features/books/components/EmptyState";
import ErrorState from "@/features/books/components/ErrorState";

interface BookTableProps {
  books: Book[];
  isLoading?: boolean;
  isError?: boolean;
  error?: Error;
  onRetry?: () => void;
}

const COLUMNS = ["Title", "Author", "Genre", "Synopsis"] as const;

function BookTable({ books, isLoading, isError, onRetry }: BookTableProps) {
  if (isError) {
    return <ErrorState onRetry={onRetry} />;
  }

  if (!isLoading && books.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="overflow-x-auto">
      {isLoading && (
        <span role="status" className="sr-only">
          Loading the catalog
        </span>
      )}
      <table
        aria-label="Book catalog"
        aria-busy={isLoading}
        className="w-full min-w-[640px] overflow-hidden rounded-xl border border-[#F3EBDD]/10 bg-[#1C212B] text-left"
      >
        <thead>
          <tr className="border-b border-[#F3EBDD]/10">
            {COLUMNS.map((column) => (
              <th
                key={column}
                scope="col"
                className="px-6 py-4 font-serif text-xs font-normal uppercase tracking-[0.12em] text-[#C9A86A]"
              >
                {column}
              </th>
            ))}
          </tr>
        </thead>
        {isLoading ? (
          <BookTableSkeleton />
        ) : (
          <tbody className="divide-y divide-[#F3EBDD]/10">
            {books.map((book) => (
              <tr key={book._id} className="transition-colors duration-200 hover:bg-[#252B36]">
                <td className="px-6 py-4 font-medium text-[#F3EBDD]">{book.title}</td>
                <td className="px-6 py-4 text-[#C9C2B8]">{book.author}</td>
                <td className="px-6 py-4 text-[#9A948A]">{book.genre}</td>
                <td className="max-w-md truncate px-6 py-4 text-[#9A948A]">{book.synopsis}</td>
              </tr>
            ))}
          </tbody>
        )}
      </table>
    </div>
  );
}

export default BookTable;
