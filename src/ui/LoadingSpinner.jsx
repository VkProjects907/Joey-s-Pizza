function LoadingSpinner({ message = "Loading..." }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-4"
      role="status"
      aria-live="polite"
    >
      <div className="h-12 w-12 animate-spin rounded-full border-4 border-stone-200 border-t-yellow-400" />

      <p className="text-sm font-medium text-stone-500">{message}</p>

      <span className="sr-only">Please wait</span>
    </div>
  );
}

export default LoadingSpinner;
