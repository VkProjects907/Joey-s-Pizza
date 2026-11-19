import { createHash } from "node:crypto";
import connectDB from "./mongodb";
import Order from "../models/Order";

export function hashAccessToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function toPublicOrder(order) {
  if (!order) return null;

  return {
    id: order.orderNumber,
    orderNumber: order.orderNumber,
    status: order.orderStatus,
    priority: order.priority,
    priorityPrice: order.priorityFeeCents / 100,
    orderPrice: order.subtotalCents / 100,
    estimatedDelivery: order.deliveryEstimateAt,
    cart: order.items.map((item) => ({
      pizzaId: item.pizzaId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
      totalPrice: (item.unitPriceCents * item.quantity) / 100,
    })),
  };
}

export async function getTrackedOrder(token) {
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/i.test(token)) {
    return null;
  }

  await connectDB();
  const order = await Order.findOne({ accessTokenHash: hashAccessToken(token) })
    .select("-customer -position -accessTokenHash")
    .lean();

  return toPublicOrder(order);
}
