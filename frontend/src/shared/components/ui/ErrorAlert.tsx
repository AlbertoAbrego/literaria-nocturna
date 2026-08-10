function ErrorAlert({ message }: { message: string }) {
  return (
    <div role="alert" className="rounded border border-red-800 bg-red-950 p-4 text-red-100">
      {message}
    </div>
  );
}

export default ErrorAlert;
