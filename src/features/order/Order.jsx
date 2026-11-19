import Link from "next/link";
import OrderItem from "./OrderItem";
import LiveCountdown from "./LiveCountdown";
import { getMenu } from "../../services/apiRestaurant";
import { getTrackedOrder } from "../../../lib/orders";
import { formatCurrency, formatDate } from "../../utils/helpers";

export default async function OrderPage({ params }) {
  const { orderId: accessTokenOrNumber } = await params;
  const order = await getTrackedOrder(accessTokenOrNumber);
  if (!order) {
    return <p className="px-4 py-6">We couldn't find that order. Check your tracking link or confirmation number and try again.</p>;
  }
  if (order.paymentStatus !== "paid") {
    return (
      <section className="space-y-4 px-4 py-8">
        <h1 className="text-2xl font-semibold">Payment not completed</h1>
        <p className="text-stone-600">This order hasn&apos;t been accepted yet. The delivery countdown starts after payment is confirmed.</p>
        {order.canManage ? (
          <Link className="inline-flex rounded-lg bg-stone-900 px-4 py-2.5 font-semibold text-white hover:bg-stone-700" href={`/order/${accessTokenOrNumber}/payment`}>
            Continue to payment
          </Link>
        ) : (
          <Link className="inline-flex rounded-lg border border-stone-300 px-4 py-2.5 font-semibold text-stone-800 hover:bg-white" href="/menu">
            Return to menu
          </Link>
        )}
      </section>
    );
  }

  let menu = [];
  try {
    menu = await getMenu();
  } catch {
    // The saved order can still be tracked if the menu service is unavailable.
  }

  const {
    orderNumber,
    status,
    priority,
    priorityPrice,
    orderPrice,
    estimatedDelivery,
    paymentStatus,
    cart,
  } = order;

  return (
    <div className="space-y-8 px-4 py-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold">Order #{orderNumber} status</h2>
        <div className="space-x-2">
          {priority && (
            <span className="rounded-full bg-red-500 px-3 py-1 text-sm font-semibold uppercase text-red-50">
              Priority
            </span>
          )}
          <span className="rounded-full bg-green-500 px-3 py-1 text-sm font-semibold uppercase text-green-50">
            {status.replaceAll("_", " ")} order
          </span>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 bg-stone-200 px-6 py-5">
        <p className="font-medium">
          <LiveCountdown deliveryAt={estimatedDelivery} />
        </p>
        <p className="text-xs text-stone-500">
          (Estimated delivery: {formatDate(estimatedDelivery)})
        </p>
      </div>

      <ul className="divide-y divide-stone-200 border-b border-t">
        {cart.map((item) => (
          <OrderItem
            item={item}
            key={item.pizzaId}
            ingredients={menu.find((pizza) => String(pizza.id) === item.pizzaId)?.ingredients ?? []}
          />
        ))}
      </ul>

      <div className="space-y-2 bg-stone-200 px-6 py-5">
        <p className="text-sm font-medium text-stone-600">
          Pizza subtotal: {formatCurrency(orderPrice)}
        </p>
        {priority && (
          <p className="text-sm font-medium text-stone-600">
            Priority fee: {formatCurrency(priorityPrice)}
          </p>
        )}
        <p className="font-bold">Order total: {formatCurrency(orderPrice + priorityPrice)}</p>
        <p className="text-sm font-medium text-stone-600">
          Payment: {paymentStatus === "paid" ? "Paid (Stripe test mode)" : paymentStatus}
        </p>
      </div>

    </div>
  );
}
