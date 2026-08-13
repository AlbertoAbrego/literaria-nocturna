import { useNavigate, useParams } from "react-router";
import {
  BookDetailsNotFound,
  BookDetailsSkeleton,
  BookForm,
  ErrorState,
} from "@/features/books/components";
import { useBook } from "@/features/books/hooks/useBook";
import PageContainer from "@/shared/components/layout/PageContainer";

function EditBookPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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
      <header className="mb-8">
        <h1 className="font-heading text-3xl text-parchment">Edit Volume</h1>
      </header>
      <BookForm
        id={id}
        initialValues={{
          title: data.title,
          author: data.author,
          genre: data.genre,
          synopsis: data.synopsis,
        }}
        onUpdated={() => navigate(`/books/${data._id}`)}
      />
    </PageContainer>
  );
}

export default EditBookPage;
