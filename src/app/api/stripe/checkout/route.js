import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import { canAccessOrder, hashAccessToken, markOrderPaid, updateOrderFromPaymentIntent } from "../../../../../lib/orders";
import { randomUUID } from "node:crypto";
import { getStripe } from "../../../../../lib/stripe";
import Order from "../../../../../models/Order";
import { sendOrderNotifications } from "../../../../../lib/orderNotifications";

export const runtime = "nodejs";

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    return NextResponse.json(
      { message: "Stripe test mode is not configured. Add an sk_test_ key to the server environment." },
      { status: 503 },
    );
  }

  try {
    const { accessToken } = await request.json();
    if (typeof accessToken !== "string" || !/^[a-f0-9]{64}$/i.test(accessToken)) {
      return NextResponse.json({ message: "Invalid order tracking token." }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findOne({ accessTokenHash: hashAccessToken(accessToken) })
      .select("+checkoutSessionId +paymentIntentId +paymentAttemptId");

    if (!order || !(await canAccessOrder(order))) return NextResponse.json({ message: "Order not found." }, { status: 404 });
    if (["paid", "refunded"].includes(order.paymentStatus)) {
      return NextResponse.json({ message: "This order cannot be checked out." }, { status: 409 });
    }
    if (!Number.isSafeInteger(order.totalCents) || order.totalCents < 50) {
      return NextResponse.json({ message: "Order total is not valid for card checkout." }, { status: 400 });
    }

    const stripe = getStripe();
    if (order.checkoutSessionId) {
      const oldSession = await stripe.checkout.sessions.retrieve(order.checkoutSessionId);
      if (oldSession.status === "complete" && oldSession.payment_status === "paid") {
        markOrderPaid(order);
        order.paymentIntentId = typeof oldSession.payment_intent === "string"
          ? oldSession.payment_intent
          : oldSession.payment_intent?.id;
        if (oldSession.customer_details?.email) {
          order.customer.email = oldSession.customer_details.email.toLowerCase();
        }
        if (oldSession.customer_details?.phone) {
          order.customer.phone = oldSession.customer_details.phone;
        }
        await order.save();
        await sendOrderNotifications(order);
        return NextResponse.json({ alreadyPaid: true });
      }
      if (oldSession.status === "open") await stripe.checkout.sessions.expire(oldSession.id);
      order.checkoutSessionId = undefined;
    }

    if (order.paymentIntentId) {
      const existingIntent = await stripe.paymentIntents.retrieve(order.paymentIntentId, {
        expand: ["payment_method"],
      });
      if (existingIntent.status === "succeeded") {
        await updateOrderFromPaymentIntent(order, existingIntent);
        markOrderPaid(order);
        await order.save();
        await sendOrderNotifications(order);
        return NextResponse.json({ alreadyPaid: true });
      }
      if (existingIntent.status !== "canceled" && existingIntent.client_secret) {
        return NextResponse.json({
          clientSecret: existingIntent.client_secret,
          paymentIntentId: existingIntent.id,
        });
      }
      order.paymentIntentId = undefined;
      order.paymentAttemptId = randomUUID();
    }

    if (!order.paymentAttemptId) order.paymentAttemptId = randomUUID();
    await order.save();

    const metadata = {
      orderId: String(order._id),
      orderNumber: order.orderNumber,
    };
    const intent = await stripe.paymentIntents.create({
      amount: order.totalCents,
      currency: String(order.currency || "USD").toLowerCase(),
      automatic_payment_methods: { enabled: true },
      metadata,
      description: `Joey's Pizza order #${order.orderNumber}`,
    }, {
      idempotencyKey: `pizza-order-${order._id}-${order.paymentAttemptId}`,
    });

    order.paymentIntentId = intent.id;
    order.checkoutStarted = true;
    await order.save();

    return NextResponse.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (error) {
    console.error("Stripe PaymentIntent setup failed:", {
      message: error.message,
      type: error.type,
      code: error.code,
      param: error.param,
      requestId: error.requestId,
    });
    return NextResponse.json(
      {
        message: process.env.NODE_ENV === "development" && error instanceof Error
          ? error.message
          : "Could not start test checkout. Check the server configuration and try again.",
      },
      { status: 500 },
    );
  }
}

