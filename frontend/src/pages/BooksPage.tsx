import { BookTable } from "@/features/books/components";
import { useBooks } from "@/features/books/hooks/useBooks";
import PageContainer from "@/shared/components/layout/PageContainer";

function BooksPage() {
  const { data, isLoading, isError, error, refetch } = useBooks();

  return (
    <PageContainer>
      <header className="mb-8">
        <h1 className="font-heading text-3xl text-parchment">Catalog</h1>
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
