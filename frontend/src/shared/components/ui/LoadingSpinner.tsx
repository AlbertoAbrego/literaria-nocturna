function LoadingSpinner() {
  return (
    <div role="status" className="flex items-center justify-center p-8" aria-label="Loading">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-800 border-t-slate-100" />
    </div>
  );
}

export default LoadingSpinner;
