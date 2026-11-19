"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useNavigationLoading } from "../../ui/NavigationLoadingProvider";

function SearchOrder() {
  const [query, setQuery] = useState("");
  const router = useRouter();
  const { startNavigation } = useNavigationLoading();

  function handleSubmit(e) {
    e.preventDefault();
    const code = query.trim();
    const isOrderNumber = /^(?:[a-f0-9]{12}|[a-f0-9]{20})$/i.test(code);
    const isAccessToken = /^[a-f0-9]{64}$/i.test(code);
    if (!isOrderNumber && !isAccessToken) return;

    startNavigation();
    router.push(`/order/${code}`);
    setQuery("");
  }

  return (
    <form onSubmit={handleSubmit} className="flex items-center rounded-lg border border-stone-200 bg-white shadow-sm focus-within:border-amber-400 focus-within:ring-2 focus-within:ring-amber-100">
      <input
        aria-label="Search order number"
        placeholder="Order #"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-20 bg-transparent px-2.5 py-2 text-sm placeholder:text-stone-400 focus:outline-none sm:w-36 sm:px-3"
      />
      <button type="submit" className="rounded-r-lg bg-stone-100 px-2.5 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-200 sm:px-3"><span className="sm:hidden">Go</span><span className="hidden sm:inline">Search</span></button>
    </form>
  );
}

export default SearchOrder;
