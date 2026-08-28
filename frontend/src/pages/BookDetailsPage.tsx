import { useParams } from "react-router";
import {
  BookDetails,
  BookDetailsNotFound,
  BookDetailsSkeleton,
  ErrorState,
} from "@/features/books/components";
import { useBook } from "@/features/books/hooks/useBook";
import PageContainer from "@/shared/components/layout/PageContainer";

function BookDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const { data, isLoading, isError, isNotFound, refetch } = useBook(id);

  if (isLoading) {
    return (
      <PageContainer>
        <BookDetailsSkeleton />
      </PageContainer>
    );
  }

  if (isNotFound) {
    return (
      <PageContainer>
        <BookDetailsNotFound />
      </PageContainer>
    );
  }

  if (isError || !data) {
    return (
      <PageContainer>
        <ErrorState onRetry={refetch} />
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <BookDetails book={data} />
    </PageContainer>
  );
}

export default BookDetailsPage;
