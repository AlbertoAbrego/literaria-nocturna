import { Link } from "react-router";
import { BookTable, FilterBar } from "@/features/books/components";
import { useBookFilters } from "@/features/books/hooks/useBookFilters";
import { useBooks } from "@/features/books/hooks/useBooks";
import PageContainer from "@/shared/components/layout/PageContainer";
import { Pagination } from "@/shared/components/ui";

function BooksPage() {
  const filters = useBookFilters();
  const { data, isLoading, isError, error, refetch } = useBooks(filters.queryParams);
  const activeFilterCount = Object.keys(filters.queryParams).length;

  const pagination = data?.pagination;
  const start = pagination ? (pagination.page - 1) * pagination.limit + 1 : 0;
  const end = pagination ? Math.min(pagination.page * pagination.limit, pagination.total) : 0;

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

      <div className="mb-8">
        <FilterBar
          title={filters.title}
          author={filters.author}
          genre={filters.genre}
          onTitleChange={filters.setTitle}
          onAuthorChange={filters.setAuthor}
          onGenreChange={filters.setGenre}
          onReset={filters.resetFilters}
          isFiltered={filters.isFiltered}
        />
        {filters.isFiltered && (
          <p className="mt-3 text-sm text-fog">
            {activeFilterCount} active {activeFilterCount === 1 ? "filter" : "filters"}
          </p>
        )}
      </div>

      <BookTable
        books={data?.data ?? []}
        isLoading={isLoading}
        isError={isError}
        error={error ?? undefined}
        isFiltered={filters.isFiltered}
        onRetry={refetch}
      />

      {data && data.data.length > 0 && pagination && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <p className="text-sm text-fog">
            Showing {start}–{end} of {pagination.total}{" "}
            {pagination.total === 1 ? "volume" : "volumes"}
          </p>
          <Pagination
            currentPage={filters.page}
            totalPages={pagination.totalPages}
            onPageChange={filters.setPage}
            isLoading={isLoading}
          />
        </div>
      )}
    </PageContainer>
  );
}

export default BooksPage;