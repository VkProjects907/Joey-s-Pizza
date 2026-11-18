import Link from "next/link";
import { confirmCheckoutPayment, confirmPaymentIntent, getTrackedOrder } from "../../../../../lib/orders";
import { formatCurrency } from "../../../../utils/helpers";
import SyncGuestContact from "../../../../features/order/SyncGuestContact";

export default async function OrderConfirmationPage({ params, searchParams }) {
  const { orderId: accessToken } = await params;
  const query = searchParams ? await searchParams : {};
  const order = await getTrackedOrder(accessToken);

  if (!order || !order.canManage) {
    return <p className="px-4 py-6">We couldn't verify that order confirmation.</p>;
  }

  if ((query.payment_intent || query.session_id) && order.paymentStatus !== "paid") {
    try {
      if (query.payment_intent) await confirmPaymentIntent(accessToken, query.payment_intent);
      else await confirmCheckoutPayment(accessToken, query.session_id);
    } catch (error) {
      console.error("Payment return verification failed:", error.message);
    }
  }

  const currentOrder = await getTrackedOrder(accessToken);
  if (currentOrder?.paymentStatus !== "paid") {
    return (
      <section className="space-y-5 px-4 py-8">
        <h1 className="text-2xl font-semibold">Payment confirmation is processing</h1>
        <p className="text-stone-600">
          Order #{order.orderNumber} is still pending confirmation. Refresh this page in a moment,
          or return to payment to try again.
        </p>
        <Link className="text-blue-700 underline" href={`/order/${accessToken}/payment`}>
          Return to payment
        </Link>
      </section>
    );
  }

  return (
    <section className="space-y-6 px-4 py-8">
      <SyncGuestContact customer={currentOrder.customer} />
      <div>
        <p className="font-semibold text-green-700">Payment received</p>
        <h1 className="mt-2 text-2xl font-semibold">Thanks for your order!</h1>
        <p className="mt-2 text-stone-600">Confirmation number: #{currentOrder.orderNumber}</p>
      </div>

            <div className="rounded-md bg-stone-100 p-5 text-sm">
        <h2 className="mb-2 font-semibold">Contact details saved with this order</h2>
        <p>{currentOrder.customer.name}</p>
        {currentOrder.customer.phone && <p>{currentOrder.customer.phone}</p>}
        {currentOrder.customer.email && <p>{currentOrder.customer.email}</p>}
        <p>{currentOrder.customer.address}</p>
      </div>
<div className="rounded-md bg-stone-100 p-5">
        <ul className="divide-y divide-stone-300">
          {currentOrder.cart.map((item) => (
            <li className="flex justify-between gap-4 py-3" key={item.pizzaId}>
              <span>{item.quantity}&times; {item.name}</span>
              <span>{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        {currentOrder.priority && (
          <p className="border-t border-stone-300 pt-3 text-sm">
            Priority fee: {formatCurrency(currentOrder.priorityPrice)}
          </p>
        )}
        <p className="mt-3 border-t border-stone-300 pt-3 font-bold">
          Paid in Stripe test mode: {formatCurrency(currentOrder.orderPrice + currentOrder.priorityPrice)}
        </p>
      </div>

      <Link className="inline-block text-blue-700 underline" href={`/order/${accessToken}`}>
        Track this order
      </Link>
    </section>
  );
}



