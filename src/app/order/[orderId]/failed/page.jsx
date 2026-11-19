import Link from "next/link";
import { redirect } from "next/navigation";
import { getTrackedOrder } from "../../../../../lib/orders";

export const metadata = { title: "Payment not completed | Joey's Pizza" };

export default async function PaymentFailedPage({ params }) {
  const { orderId: accessToken } = await params;
  const order = await getTrackedOrder(accessToken);

  if (!order || !order.canManage) {
    return <p className="px-4 py-8">We couldn&apos;t find that checkout. It may have expired.</p>;
  }
  if (order.paymentStatus === "paid") redirect(`/order/${accessToken}/confirmation`);

  return (
    <section className="mx-auto max-w-2xl space-y-5 px-4 py-10">
      <div className="rounded-2xl border border-rose-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-rose-700">Payment not completed</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">Your order has not been placed</h1>
        <p className="mt-3 text-stone-600">The payment didn&apos;t go through, so we haven&apos;t started preparing your order or delivery countdown.</p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Link className="rounded-lg bg-stone-900 px-4 py-2.5 font-semibold text-white hover:bg-stone-700" href={`/order/${accessToken}/payment`}>
          Try payment again
        </Link>
        <Link className="rounded-lg border border-stone-300 px-4 py-2.5 font-semibold text-stone-800 hover:bg-white" href="/menu">
          Return to menu
        </Link>
      </div>
    </section>
  );
}
