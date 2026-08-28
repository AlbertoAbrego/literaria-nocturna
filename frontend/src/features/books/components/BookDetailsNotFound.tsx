import { Link } from "react-router";

function BookDetailsNotFound() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 px-6 py-16 text-center">
      <p className="max-w-sm font-heading text-2xl text-parchment">
        This volume does not exist in the catalog.
      </p>
      <Link
        to="/books"
        className="rounded-button px-4 py-2 text-sm text-fog transition-colors duration-200 hover:bg-midnight hover:text-parchment"
      >
        Back to the catalog
      </Link>
    </div>
  );
}

export default BookDetailsNotFound;
