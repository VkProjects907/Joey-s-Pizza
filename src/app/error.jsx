"use client";

export default function Error({ error, reset }) {
  return (
    <div className="px-4 py-10 text-center">
      <h2 className="text-xl font-semibold">Something went wrong 😢</h2>

      <p className="mt-3 text-stone-600">
        {error.message || "An unexpected error occurred."}
      </p>

      <button
        onClick={() => reset()}
        className="mt-6 rounded-full bg-yellow-400 px-5 py-2 font-semibold hover:bg-yellow-500"
      >
        Try again
      </button>
    </div>
  );
}
