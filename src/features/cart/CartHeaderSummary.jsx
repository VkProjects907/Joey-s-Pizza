"use client";

import Link from "next/link";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { formatCurrency } from "../../utils/helpers";
import { getCart, getTotalCartPrice, getTotalCartQuantity } from "./cartSlice";

export default function CartHeaderSummary() {
  const detailsRef = useRef(null);
  const pathname = usePathname();
  const cart = useSelector(getCart);
  const quantity = useSelector(getTotalCartQuantity);
  const subtotal = useSelector(getTotalCartPrice);

  useEffect(() => {
    if (detailsRef.current) detailsRef.current.open = false;
  }, [pathname]);

  if (!quantity) {
    return (
      <Link href="/cart" className="rounded-lg border border-stone-200 px-3 py-2 text-xs font-semibold text-stone-700 hover:bg-stone-100 sm:text-sm">
        Cart <span className="ml-1 text-stone-500">0</span>
      </Link>
    );
  }

  return (
    <details ref={detailsRef} className="group relative shrink-0">
      <summary aria-label={`Cart: ${quantity} items, ${formatCurrency(subtotal)}`} className="flex cursor-pointer list-none items-center gap-2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs font-semibold text-stone-800 shadow-sm hover:bg-stone-50 sm:text-sm [&::-webkit-details-marker]:hidden">
        <span>Cart</span>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-amber-900">{quantity}</span>
        <span className="hidden text-stone-500 sm:inline">{formatCurrency(subtotal)}</span>
        <span aria-hidden="true" className="text-stone-400">⌄</span>
      </summary>
      <div className="absolute right-0 top-full z-50 mt-3 w-[min(22rem,calc(100vw-1.5rem))] rounded-xl border border-stone-200 bg-white p-4 text-sm normal-case shadow-xl">
        <div className="mb-3 flex items-center justify-between border-b border-stone-100 pb-3">
          <h2 className="font-bold text-stone-900">Your cart</h2>
          <span className="text-xs text-stone-500">{quantity} {quantity === 1 ? "item" : "items"}</span>
        </div>
        <ul className="max-h-64 space-y-3 overflow-auto">
          {cart.map((item) => (
            <li key={item.pizzaId} className="flex justify-between gap-3">
              <span className="min-w-0 text-stone-700"><span className="font-semibold text-stone-900">{item.quantity}×</span> {item.name}</span>
              <span className="shrink-0 font-medium text-stone-800">{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-4 flex items-center justify-between border-t border-stone-200 pt-3 font-bold text-stone-900">
          <span>Subtotal</span>
          <span>{formatCurrency(subtotal)}</span>
        </div>
        <Link href="/cart" className="mt-4 block rounded-lg bg-stone-900 px-4 py-2.5 text-center font-semibold text-white hover:bg-stone-700">
          Review cart
        </Link>
      </div>
    </details>
  );
}
