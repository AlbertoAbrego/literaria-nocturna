import Button from "@/shared/components/ui/Button";

interface ErrorStateProps {
  onRetry?: () => void;
}

function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div role="alert" className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
      <p className="max-w-sm text-sm text-error">The archive could not be reached.</p>
      {onRetry && (
        <Button variant="primary" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export default ErrorState;
