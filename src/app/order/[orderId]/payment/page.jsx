import Link from "next/link";
import { redirect } from "next/navigation";
import StripePaymentForm from "../../../../features/order/StripePaymentForm";
import { getTrackedOrder } from "../../../../../lib/orders";
import { formatCurrency } from "../../../../utils/helpers";

export default async function PaymentPage({ params, searchParams }) {
  const { orderId: accessToken } = await params;
  const query = searchParams ? await searchParams : {};
  const order = await getTrackedOrder(accessToken);

  if (!order) return <p className="px-4 py-6">We couldn't find that order.</p>;
  if (!order.canManage) {
    return <p className="px-4 py-6">Open the private tracking link from your order to continue to payment.</p>;
  }
  if (order.paymentStatus === "paid") redirect(`/order/${accessToken}/confirmation`);

  return (
    <section className="space-y-6 px-4 py-6">
      <div>
        <h1 className="text-2xl font-semibold">Payment for order #{order.orderNumber}</h1>
        <p className="mt-2 text-sm text-stone-600">
          Your order is saved. Review the prefilled, editable contact details in Stripe&apos;s secure test payment form.
        </p>
      </div>

      {query.payment === "cancelled" && (
        <p className="rounded-md bg-yellow-100 p-3 text-sm text-yellow-900">
          Payment was cancelled. Your order is still unpaid; you can try again below.
        </p>
      )}

      <div className="space-y-3 rounded-md bg-stone-100 p-5">
        <ul className="divide-y divide-stone-300">
          {order.cart.map((item) => (
            <li className="flex justify-between gap-4 py-3" key={item.pizzaId}>
              <span>{item.quantity}&times; {item.name}</span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        {order.priority && <p className="text-sm">Priority fee: {formatCurrency(order.priorityPrice)}</p>}
        <p className="border-t border-stone-300 pt-3 text-lg font-bold">
          Total: {formatCurrency(order.orderPrice + order.priorityPrice)}
        </p>
        <p className="text-sm text-stone-600">Payment status: {order.paymentStatus}</p>
      </div>

      {order.paymentStatus !== "refunded" && (
        <StripePaymentForm
          accessToken={accessToken}
          customer={order.customer}
          totalCents={Math.round((order.orderPrice + order.priorityPrice) * 100)}
        />
      )}

      <Link className="inline-block text-sm text-blue-700 underline" href={`/order/${accessToken}`}>
        Back to order tracking
      </Link>
    </section>
  );
}
