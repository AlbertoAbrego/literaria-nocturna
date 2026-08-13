import { Link } from "react-router";
import { BookTable } from "@/features/books/components";
import { useBooks } from "@/features/books/hooks/useBooks";
import PageContainer from "@/shared/components/layout/PageContainer";

function BooksPage() {
  const { data, isLoading, isError, error, refetch } = useBooks();

  return (
    <PageContainer>
      <header className="mb-8 flex items-center justify-between gap-4">
        <h1 className="font-heading text-3xl text-parchment">Catalog</h1>
        <Link
          to="/books/create"
          className="rounded-button bg-antique-gold px-4 py-2 text-sm font-medium text-obsidian transition-colors duration-200 hover:bg-burnished-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-antique-gold"
        >
          Create Book
        </Link>
      </header>
      <BookTable
        books={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error ?? undefined}
        onRetry={refetch}
      />
    </PageContainer>
  );
}

export default BooksPage;
