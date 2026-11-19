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
    const accessToken = query.trim();
    if (!/^[a-f0-9]{64}$/i.test(accessToken)) return;
    startNavigation();
    router.push(`/order/${accessToken}`);
    setQuery("");
  }

  return (
    <form onSubmit={handleSubmit}>
      <input
        aria-label="Order tracking access code"
        placeholder="Order access code"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-28 rounded-full bg-yellow-100 px-4 py-2 text-sm transition-all duration-300 placeholder:text-stone-400 focus:outline-none focus:ring focus:ring-yellow-500 focus:ring-opacity-50 sm:w-64 sm:focus:w-72"
      />
    </form>
  );
}

export default SearchOrder;
