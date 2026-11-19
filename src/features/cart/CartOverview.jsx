"use client";

import Link from "next/link";
import { useSelector } from "react-redux";

import { getTotalCartPrice, getTotalCartQuantity } from "./cartSlice";

import { formatCurrency } from "../../utils/helpers";

function CartOverview() {
  const totalCartQuantity = useSelector(getTotalCartQuantity);
  const totalCartPrice = useSelector(getTotalCartPrice);

  if (!totalCartQuantity) return null;

  return (
    <div className="flex flex-wrap items-center justify-start gap-x-6 gap-y-2 bg-stone-800 px-4 py-4 text-sm uppercase text-stone-200 sm:px-6 md:text-base">
      <p className="space-x-4 font-semibold text-stone-300 sm:space-x-6">
        <span>{totalCartQuantity} pizzas</span>
        <span>{formatCurrency(totalCartPrice)}</span>
      </p>

      <Link className="rounded-sm underline-offset-4 hover:underline focus:outline-none focus:ring-2 focus:ring-yellow-400" href="/cart">Open cart &rarr;</Link>
    </div>
  );
}

export default CartOverview;
