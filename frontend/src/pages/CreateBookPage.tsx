import { useNavigate } from "react-router";
import { BookForm } from "@/features/books/components";
import PageContainer from "@/shared/components/layout/PageContainer";

function CreateBookPage() {
  const navigate = useNavigate();

  return (
    <PageContainer>
      <header className="mb-8">
        <h1 className="font-heading text-3xl text-parchment">Add a New Volume</h1>
      </header>
      <BookForm onCreated={() => navigate("/books")} />
    </PageContainer>
  );
}

export default CreateBookPage;
