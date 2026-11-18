"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";

function LinkButton({ children, to }) {
  const router = useRouter();

  const className = "text-sm text-blue-500 hover:text-blue-600 hover:underline";

  if (to === "-1") {
    return (
      <button type="button" className={className} onClick={() => router.back()}>
        {children}
      </button>
    );
  }

  return (
    <Link href={to} className={className}>
      {children}
    </Link>
  );
}

export default LinkButton;
