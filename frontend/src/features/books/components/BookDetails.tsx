import { Link } from "react-router";
import type { Book } from "@/features/books/types";

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString();
}

interface BookDetailsProps {
  book: Book;
}

function BookDetails({ book }: BookDetailsProps) {
  return (
    <article>
      <Link
        to="/books"
        className="mb-6 inline-block px-3 py-2 text-sm text-fog transition-colors duration-200 hover:bg-midnight hover:text-parchment"
      >
        &larr; Back to catalog
      </Link>
      <div className="rounded-card border border-graphite bg-charcoal p-6 sm:p-8">
        <div className="flex items-start justify-between gap-4">
          <span className="inline-block rounded-button border border-antique-gold/40 bg-antique-gold/10 px-3 py-1 text-xs tracking-wide text-antique-gold">
            {book.genre}
          </span>
          <Link
            to={`/books/${book._id}/edit`}
            className="inline-block px-3 py-2 text-sm text-fog transition-colors duration-200 hover:bg-midnight hover:text-parchment"
          >
            Edit this volume
          </Link>
        </div>
        <h1 className="mt-4 font-heading text-4xl text-parchment">{book.title}</h1>
        <p className="mt-2 text-fog">by {book.author}</p>
        <hr className="my-6 border-graphite" />
        <p className="leading-relaxed text-parchment/90">{book.synopsis}</p>
        <dl className="mt-8 grid gap-6 text-sm sm:grid-cols-2">
          <div>
            <dt className="uppercase tracking-wide text-ash">Cataloged</dt>
            <dd className="mt-1 text-fog">{formatDate(book.createdAt)}</dd>
          </div>
          <div>
            <dt className="uppercase tracking-wide text-ash">Last updated</dt>
            <dd className="mt-1 text-fog">{formatDate(book.updatedAt)}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}

export default BookDetails;