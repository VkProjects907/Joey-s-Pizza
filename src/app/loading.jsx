import LoadingSpinner from "../ui/LoadingSpinner";

export default function Loading() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <LoadingSpinner message="Preparing your pizza experience..." />
    </main>
  );
}
