function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <svg
        aria-hidden="true"
        className="h-12 w-12 text-[#9A948A]"
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
      <p className="max-w-sm text-sm text-[#9A948A]">
        No volumes have been <span className="text-[#F3EBDD]">cataloged</span> yet.
      </p>
    </div>
  );
}

export default EmptyState;
