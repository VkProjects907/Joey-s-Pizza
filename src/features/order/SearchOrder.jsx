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
    <form onSubmit={handleSubmit}>
      <input
        aria-label="Search order number"
        placeholder="Search order #"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-28 rounded-full bg-yellow-100 px-4 py-2 text-sm transition-all duration-300 placeholder:text-stone-400 focus:outline-none focus:ring focus:ring-yellow-500 focus:ring-opacity-50 sm:w-64 sm:focus:w-72"
      />
    </form>
  );
}

export default SearchOrder;
