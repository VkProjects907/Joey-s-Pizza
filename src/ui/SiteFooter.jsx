"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteFooter() {
  const pathname = usePathname();
  const inOrderFlow = pathname === "/menu" || pathname === "/cart" || pathname === "/order/new" || /^\/order\/[^/]+\/payment$/.test(pathname);
  if (inOrderFlow) return null;

  return (
    <footer className="border-t border-stone-200 bg-white px-4 py-5 text-sm text-stone-500 sm:px-6">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3">
        <p>© {new Date().getFullYear()} Joey&apos;s Pizza · Demo ordering experience</p>
        <nav aria-label="Legal" className="flex items-center gap-5">
          <Link className="hover:text-stone-900" href="/privacy">Privacy</Link>
          <Link className="hover:text-stone-900" href="/terms">Terms</Link>
        </nav>
      </div>
    </footer>
  );
}
