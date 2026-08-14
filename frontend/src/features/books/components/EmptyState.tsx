interface EmptyStateProps {
  filtered?: boolean;
}

function EmptyState({ filtered = false }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <svg
        aria-hidden="true"
        className="h-12 w-12 text-ash"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M2 4h6a4 4 0 0 1 4 4v12a3 3 0 0 0-3-3H2z" />
        <path d="M22 4h-6a4 4 0 0 0-4 4v12a3 3 0 0 1 3-3h7z" />
      </svg>
      {filtered ? (
        <p className="max-w-sm text-sm text-ash">
          No volumes match the <span className="text-parchment">current search</span>.
        </p>
      ) : (
        <p className="max-w-sm text-sm text-ash">
          No volumes have been <span className="text-parchment">cataloged</span> yet.
        </p>
      )}
    </div>
  );
}

export default EmptyState;
