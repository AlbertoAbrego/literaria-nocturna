interface ErrorStateProps {
  onRetry?: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="max-w-sm text-sm text-[#A35A5A]">The archive could not be reached.</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded-[10px] bg-[#C9A86A] px-4 py-2 text-sm font-medium text-[#0F1115] transition-colors duration-200 hover:bg-[#A8894F]"
        >
          Retry
        </button>
      )}
    </div>
  );
}

export default ErrorState;
