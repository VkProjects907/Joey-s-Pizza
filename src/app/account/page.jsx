import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "../../../lib/auth";
import { cleanupUnpaidOrders, reconcileUserPayments } from "../../../lib/orders";
import Order from "../../../models/Order";

export const dynamic = "force-dynamic";
export const metadata = { title: "Your account | Joey's Pizza" };

export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  await reconcileUserPayments(user.id);
  await cleanupUnpaidOrders();
  const orders = await Order.find({ userId: user.id, paymentStatus: "paid" })
    .select("orderNumber orderStatus paymentStatus totalCents currency createdAt paidAt")
    .sort({ paidAt: -1, createdAt: -1 })
    .limit(50)
    .lean();

  return (
    <section className="space-y-8 px-4 py-8 sm:px-6 sm:py-10">
      <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold text-amber-700">Account overview</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-stone-900">Welcome, {user.name}</h1>
        <p className="mt-2 text-sm text-stone-600">Signed in as {user.email}</p>
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-stone-900">Your orders</h2>
            <p className="mt-1 text-sm text-stone-600">Orders placed while signed in to this account.</p>
          </div>
          <Link className="rounded-lg bg-stone-900 px-4 py-2 text-sm font-semibold text-white hover:bg-stone-700" href="/menu">Start an order</Link>
        </div>
        {orders.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-white px-6 py-10 text-center">
            <p className="font-semibold text-stone-900">No account orders yet</p>
            <p className="mt-2 text-sm text-stone-600">Orders placed while signed in will show up here.</p>
          </div>
        ) : (
          <ul className="grid gap-3">
            {orders.map((order) => (
              <li className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm sm:p-6" key={order._id.toString()}>
                <div className="min-w-0">
                  <p className="font-bold text-stone-900">Order #{order.orderNumber}</p>
                  <p className="mt-1 text-sm text-stone-500">{new Date(order.paidAt || order.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold capitalize text-amber-900">{order.orderStatus.replaceAll("_", " ")}</span>
                    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${order.paymentStatus === "paid" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-700"}`}>Payment {order.paymentStatus}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-semibold text-stone-900">{new Intl.NumberFormat("en-US", { style: "currency", currency: String(order.currency || "USD").toUpperCase() }).format(order.totalCents / 100)}</span>
                  <Link className="rounded-lg border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-800 hover:bg-stone-50" href={`/order/${order.orderNumber}`}>View order</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
