import CreateOrder from "../../../features/order/CreateOrder";
import EditPendingOrderContact from "../../../features/order/EditPendingOrderContact";
import { notFound, redirect } from "next/navigation";
import { getTrackedOrder } from "../../../../lib/orders";

export default async function NewOrderPage({ searchParams }) {
  const query = searchParams ? await searchParams : {};
  const accessToken = typeof query.accessToken === "string" ? query.accessToken : "";
  if (accessToken) {
    const order = await getTrackedOrder(accessToken);
    if (!order?.canManage) notFound();
    if (order.paymentStatus === "paid") redirect(`/order/${encodeURIComponent(accessToken)}/confirmation`);
    return <EditPendingOrderContact accessToken={accessToken} order={order} />;
  }
  return <CreateOrder />;
}
