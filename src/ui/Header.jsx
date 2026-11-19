import Link from "next/link";

import SearchOrder from "../features/order/SearchOrder";
import AccountMenu from "../features/user/AccountMenu";
import CartHeaderSummary from "../features/cart/CartHeaderSummary";

function Header() {
  return (
    <header className="sticky top-0 z-30 border-b border-stone-200/80 bg-white/95 px-4 backdrop-blur sm:px-6">
      <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-3">
        <Link href="/" className="shrink-0 text-base font-bold tracking-tight text-stone-900 sm:text-lg">
          <span className="mr-2 inline-flex size-8 items-center justify-center rounded-lg bg-amber-400 text-sm">J</span>
          <span className="hidden sm:inline">Joey&apos;s Pizza</span>
        </Link>
        <nav aria-label="Main navigation" className="ml-auto flex items-center gap-1 sm:gap-2">
          <Link href="/menu" className="hidden rounded-lg px-3 py-2 text-sm font-medium text-stone-700 hover:bg-stone-100 sm:inline-flex">Menu</Link>
          <SearchOrder />
          <CartHeaderSummary />
          <AccountMenu />
        </nav>
      </div>
    </header>
  );
}

export default Header;
