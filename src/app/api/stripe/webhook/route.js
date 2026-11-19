import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import { getStripe } from "../../../../../lib/stripe";
import { markOrderPaid, updateOrderFromPaymentIntent } from "../../../../../lib/orders";
import Order from "../../../../../models/Order";
import { sendOrderNotifications } from "../../../../../lib/orderNotifications";

export const runtime = "nodejs";

export async function POST(request) {
  if (!process.env.STRIPE_SECRET_KEY?.startsWith("sk_test_")) {
    return NextResponse.json({ message: "Stripe test mode is not configured." }, { status: 503 });
  }
  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    return NextResponse.json({ message: "Stripe webhook signing secret is not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ message: "Missing Stripe signature." }, { status: 400 });
  }

  let event;
  try {
    event = getStripe().webhooks.constructEvent(
      await request.text(),
      signature,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch {
    return NextResponse.json({ message: "Invalid Stripe webhook signature." }, { status: 400 });
  }

  try {
    await connectDB();
    const stripe = getStripe();

    if (event.type === "payment_intent.succeeded") {
      const eventIntent = event.data.object;
      const order = await Order.findOne({ paymentIntentId: eventIntent.id });
      if (!order) return NextResponse.json({ received: true });

      const intent = await stripe.paymentIntents.retrieve(eventIntent.id, {
        expand: ["payment_method"],
      });
      const matchesOrder =
        intent.livemode === false &&
        intent.status === "succeeded" &&
        intent.amount === order.totalCents &&
        intent.currency === String(order.currency).toLowerCase() &&
        intent.metadata?.orderId === String(order._id) &&
        intent.metadata?.orderNumber === order.orderNumber;
      if (!matchesOrder) {
        return NextResponse.json({ message: "PaymentIntent did not match the pending test order." }, { status: 400 });
      }

      await updateOrderFromPaymentIntent(order, intent);
      markOrderPaid(order);
      order.paymentIntentId = intent.id;
      await order.save();
      await sendOrderNotifications(order);
      return NextResponse.json({ received: true });
    }

    if (event.type === "payment_intent.payment_failed") {
      const order = await Order.findOne({ paymentIntentId: event.data.object.id });
      if (order && order.paymentStatus === "pending") {
        order.paymentStatus = "failed";
        order.orderStatus = "pending_payment";
        await order.save();
      }
      return NextResponse.json({ received: true });
    }

    // Keep handling sessions created by the previous hosted Checkout implementation.
    const sessionEvents = [
      "checkout.session.completed",
      "checkout.session.async_payment_succeeded",
      "checkout.session.expired",
      "checkout.session.async_payment_failed",
    ];
    if (!sessionEvents.includes(event.type)) return NextResponse.json({ received: true });

    const session = event.data.object;
    const success = ["checkout.session.completed", "checkout.session.async_payment_succeeded"];
    await connectDB();
    const order = await Order.findOne({ checkoutSessionId: session.id });
    if (!order) return NextResponse.json({ received: true });

    if (success.includes(event.type)) {
      if (session.payment_status !== "paid") return NextResponse.json({ received: true });
      const matchesTestOrder =
        session.livemode === false &&
        session.amount_total === order.totalCents &&
        session.currency === String(order.currency).toLowerCase() &&
        session.client_reference_id === order.orderNumber &&
        session.metadata?.orderId === String(order._id);
      if (!matchesTestOrder) {
        return NextResponse.json({ message: "Checkout session did not match the pending test order." }, { status: 400 });
      }

      if (session.customer_details?.email) {
        order.customer.email = session.customer_details.email.toLowerCase();
      }
      if (session.customer_details?.phone) {
        order.customer.phone = session.customer_details.phone;
      }
      markOrderPaid(order);
      order.paymentIntentId = typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id;
      await order.save();
      await sendOrderNotifications(order);
    } else if (order.paymentStatus === "pending") {
      order.paymentStatus = "failed";
      order.orderStatus = "pending_payment";
      await order.save();
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Stripe webhook processing failed:", error.message);
    return NextResponse.json({ message: "Could not process Stripe event." }, { status: 500 });
  }
}

