function ErrorAlert({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-card border border-error/30 bg-midnight p-4 text-sm text-error"
    >
      {message}
    </div>
  );
}

export default ErrorAlert;
