"use client";

import dynamic from "next/dynamic";

const StoreProvider = dynamic(() => import("./StoreProvider"), {
  ssr: false,
  loading: () => null,
});

export default function Providers({ children }) {
  return <StoreProvider>{children}</StoreProvider>;
}
