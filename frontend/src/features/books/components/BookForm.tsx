import { useState } from "react";
import type { FormEvent } from "react";
import { Link } from "react-router";
import { useCreateBook } from "@/features/books/hooks/useCreateBook";
import { GENRES } from "@/features/books/types";
import {
  INITIAL_BOOK_FORM_VALUES,
  validateBookForm,
  type BookFormField,
  type BookFormValues,
} from "@/features/books/utils/bookForm";
import { ApiError } from "@/shared/api/errors";
import Button from "@/shared/components/ui/Button";
import ErrorAlert from "@/shared/components/ui/ErrorAlert";
import FormField from "@/shared/components/ui/FormField";
import Input from "@/shared/components/ui/Input";
import Select from "@/shared/components/ui/Select";
import Textarea from "@/shared/components/ui/Textarea";

interface BookFormProps {
  onCreated?: () => void;
}

function BookForm({ onCreated }: BookFormProps) {
  const createBook = useCreateBook();
  const [values, setValues] = useState<BookFormValues>(INITIAL_BOOK_FORM_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<BookFormField, string>>>({});
  const [formError, setFormError] = useState<string | null>(null);

  function handleChange(field: BookFormField, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setFieldErrors((current) => ({ ...current, [field]: undefined }));
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const errors = validateBookForm(values);
    setFieldErrors(errors);
    setFormError(null);

    if (Object.keys(errors).length > 0) {
      return;
    }

    createBook.mutate(
      {
        title: values.title.trim(),
        author: values.author.trim(),
        genre: values.genre,
        synopsis: values.synopsis.trim(),
      },
      {
        onSuccess: () => {
          setValues(INITIAL_BOOK_FORM_VALUES);
          onCreated?.();
        },
        onError: (error) => {
          if (error instanceof ApiError && error.details) {
            setFieldErrors(error.details);
          } else {
            setFormError(error instanceof Error ? error.message : "Unable to create the book.");
          }
        },
      },
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to="/books"
        className="mb-6 inline-block px-3 py-2 text-sm text-fog transition-colors duration-200 hover:bg-midnight hover:text-parchment"
      >
        &larr; Back to catalog
      </Link>

      <form noValidate onSubmit={handleSubmit} className="space-y-6">
        {formError && <ErrorAlert message={formError} />}

        <FormField id="title" label="Title" error={fieldErrors.title} required disabled={createBook.isPending}>
          <Input
            name="title"
            value={values.title}
            onChange={(event) => handleChange("title", event.target.value)}
          />
        </FormField>

        <FormField id="author" label="Author" error={fieldErrors.author} required disabled={createBook.isPending}>
          <Input
            name="author"
            value={values.author}
            onChange={(event) => handleChange("author", event.target.value)}
          />
        </FormField>

        <FormField id="genre" label="Genre" error={fieldErrors.genre} required disabled={createBook.isPending}>
          <Select
            name="genre"
            value={values.genre}
            onChange={(event) => handleChange("genre", event.target.value)}
          >
            <option value="">Select a genre</option>
            {GENRES.map((genre) => (
              <option key={genre} value={genre}>
                {genre}
              </option>
            ))}
          </Select>
        </FormField>

        <FormField id="synopsis" label="Synopsis" error={fieldErrors.synopsis} required disabled={createBook.isPending}>
          <Textarea
            name="synopsis"
            rows={5}
            value={values.synopsis}
            onChange={(event) => handleChange("synopsis", event.target.value)}
          />
        </FormField>

        <div className="pt-2">
          <Button type="submit" disabled={createBook.isPending}>
            {createBook.isPending ? "Cataloging..." : "Catalog the Book"}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default BookForm;
