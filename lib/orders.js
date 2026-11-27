import { createHash } from "node:crypto";
import connectDB from "./mongodb";
import Order from "../models/Order";
import { getStripe } from "./stripe";
import { sendOrderNotifications } from "./orderNotifications";
import { getCurrentUser } from "./auth";

export function hashAccessToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export function markOrderPaid(order) {
  if (order.paymentStatus !== "paid") {
    order.paymentStatus = "paid";
    order.orderStatus = "received";
    order.paidAt = new Date();
    order.deliveryEstimateAt = new Date(Date.now() + 30 * 60 * 1000);
  }
  order.pendingExpiresAt = undefined;
}

export async function cleanupUnpaidOrders() {
  await connectDB();
  await Order.collection.createIndex({ pendingExpiresAt: 1 }, { expireAfterSeconds: 0 });

  const staleCutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  await Order.deleteMany({
    paymentStatus: { $in: ["pending", "failed"] },
    createdAt: { $lt: staleCutoff },
  });
  await Order.updateMany(
    { paymentStatus: { $in: ["pending", "failed"] }, pendingExpiresAt: { $exists: false } },
    { $set: { pendingExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) } },
  );
}

export async function reconcileUserPayments(userId) {
  if (!userId) return;
  await connectDB();
  const pendingOrders = await Order.find({
    userId,
    paymentStatus: { $in: ["pending", "failed"] },
    paymentIntentId: { $exists: true },
  })
    .select("+paymentIntentId")
    .sort({ createdAt: -1 })
    .limit(50);

  for (const order of pendingOrders) {
    try {
      const paymentIntent = await getStripe().paymentIntents.retrieve(order.paymentIntentId, {
        expand: ["payment_method"],
      });
      const matchesOrder =
        paymentIntent.livemode === false &&
        paymentIntent.status === "succeeded" &&
        paymentIntent.amount === order.totalCents &&
        paymentIntent.currency === String(order.currency).toLowerCase() &&
        paymentIntent.metadata?.orderId === String(order._id) &&
        paymentIntent.metadata?.orderNumber === order.orderNumber;
      if (!matchesOrder) continue;

      await updateOrderFromPaymentIntent(order, paymentIntent);
      markOrderPaid(order);
      await order.save();
      await sendOrderNotifications(order);
    } catch (error) {
      console.error("Account order payment reconciliation failed:", error.message);
    }
  }
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
    paymentStatus: order.paymentStatus,
    checkoutStarted: Boolean(order.checkoutStarted),
    cart: order.items.map((item) => ({
      pizzaId: item.pizzaId,
      name: item.name,
      quantity: item.quantity,
      unitPrice: item.unitPriceCents / 100,
      totalPrice: (item.unitPriceCents * item.quantity) / 100,
    })),
  };
}

export async function canAccessOrder(order) {
  if (!order) return false;
  if (!order.userId) return true;
  const user = await getCurrentUser();
  return Boolean(user && String(order.userId) === user.id);
}

export async function getTrackedOrder(token) {
  if (typeof token !== "string") return null;

  const isAccessToken = /^[a-f0-9]{64}$/i.test(token);
  const isConfirmationNumber = /^(?:[a-f0-9]{12}|[a-f0-9]{20})$/i.test(token);
  if (!isAccessToken && !isConfirmationNumber) return null;

  await connectDB();
  const query = isAccessToken
    ? { accessTokenHash: hashAccessToken(token) }
    : { orderNumber: token.toUpperCase() };
  const order = await Order.findOne(query)
    .select(isAccessToken ? "-position -accessTokenHash -checkoutSessionId -paymentIntentId" : "-customer -position -accessTokenHash -checkoutSessionId -paymentIntentId")
    .lean();

  if (!order) return null;
  if (!(await canAccessOrder(order))) return null;
  const publicCustomer = order.customer
    ? {
        name: order.customer.name,
        phone: order.customer.phone,
        address: order.customer.address,
        email: order.customer.email,
        smsOptIn: order.customer.smsOptIn,
      }
    : undefined;
  return {
    ...toPublicOrder(order),
    canManage: isAccessToken,
    customer: isAccessToken ? publicCustomer : undefined,
  };
}

export async function confirmCheckoutPayment(accessToken, sessionId) {
  if (
    typeof accessToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(accessToken) ||
    typeof sessionId !== "string" ||
    !/^cs_test_[a-zA-Z0-9]+$/.test(sessionId)
  ) {
    return false;
  }

  await connectDB();
  const order = await Order.findOne({
    accessTokenHash: hashAccessToken(accessToken),
  }).select("+checkoutSessionId +paymentIntentId");

  if (!order || !(await canAccessOrder(order)) || order.checkoutSessionId !== sessionId) return false;
  if (order.paymentStatus === "paid") return true;

  const session = await getStripe().checkout.sessions.retrieve(sessionId);
  const matchesOrder =
    session.livemode === false &&
    session.status === "complete" &&
    session.payment_status === "paid" &&
    session.mode === "payment" &&
    session.amount_total === order.totalCents &&
    session.currency === String(order.currency).toLowerCase() &&
    session.client_reference_id === order.orderNumber &&
    session.metadata?.orderId === String(order._id);

  if (!matchesOrder) return false;

  const checkoutEmail = session.customer_details?.email;
  if (typeof checkoutEmail === "string" && checkoutEmail.trim()) {
    order.customer.email = checkoutEmail.trim().toLowerCase();
  }
  const checkoutPhone = session.customer_details?.phone;
  if (typeof checkoutPhone === "string" && checkoutPhone.trim()) {
    order.customer.phone = checkoutPhone.trim();
  }


  markOrderPaid(order);
  order.paymentIntentId =
    typeof session.payment_intent === "string"
      ? session.payment_intent
      : session.payment_intent?.id;
  await order.save();
  await sendOrderNotifications(order);
  return true;
}





export async function updateOrderFromPaymentIntent(order, paymentIntent) {
  let paymentMethod = paymentIntent.payment_method;
  if (typeof paymentMethod === "string") {
    paymentMethod = await getStripe().paymentMethods.retrieve(paymentMethod);
  }

  const billingDetails = paymentMethod?.billing_details;
  const email = billingDetails?.email;
  const phone = billingDetails?.phone;
  if (typeof email === "string" && email.trim()) {
    order.customer.email = email.trim().toLowerCase();
  }
  if (typeof phone === "string" && phone.trim()) {
    order.customer.phone = phone.trim();
  }
}

export async function confirmPaymentIntent(accessToken, paymentIntentId) {
  if (
    typeof accessToken !== "string" ||
    !/^[a-f0-9]{64}$/i.test(accessToken) ||
    typeof paymentIntentId !== "string" ||
    !/^pi_[a-zA-Z0-9]+$/.test(paymentIntentId)
  ) {
    return false;
  }

  await connectDB();
  const order = await Order.findOne({
    accessTokenHash: hashAccessToken(accessToken),
  }).select("+paymentIntentId");
  if (!order || !(await canAccessOrder(order)) || order.paymentIntentId !== paymentIntentId) return false;
  if (order.paymentStatus === "paid") return true;

  const paymentIntent = await getStripe().paymentIntents.retrieve(paymentIntentId, {
    expand: ["payment_method"],
  });
  const matchesOrder =
    paymentIntent.livemode === false &&
    paymentIntent.status === "succeeded" &&
    paymentIntent.amount === order.totalCents &&
    paymentIntent.currency === String(order.currency).toLowerCase() &&
    paymentIntent.metadata?.orderId === String(order._id) &&
    paymentIntent.metadata?.orderNumber === order.orderNumber;

  if (!matchesOrder) return false;

  await updateOrderFromPaymentIntent(order, paymentIntent);
  markOrderPaid(order);
  await order.save();
  await sendOrderNotifications(order);
  return true;
}
