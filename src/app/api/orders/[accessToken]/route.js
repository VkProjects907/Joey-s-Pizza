import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import { canAccessOrder, getTrackedOrder, hashAccessToken, markOrderPaid, toPublicOrder } from "../../../../../lib/orders";
import { getStripe } from "../../../../../lib/stripe";
import Order from "../../../../../models/Order";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { accessToken } = await params;
    const order = await getTrackedOrder(accessToken);
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ data: order }, { headers: { "Cache-Control": "private, no-store" } });
  } catch {
    return NextResponse.json({ message: "Could not load this order." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { accessToken } = await params;
    if (!/^[a-f0-9]{64}$/i.test(accessToken)) {
      return NextResponse.json({ message: "Invalid order update." }, { status: 400 });
    }

    const input = await request.json();
    await connectDB();
    const order = await Order.findOne({ accessTokenHash: hashAccessToken(accessToken) })
      .select("+checkoutSessionId");
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    if (!(await canAccessOrder(order))) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    if (["paid", "refunded"].includes(order.paymentStatus)) {
      return NextResponse.json({ message: "Paid order details cannot be changed." }, { status: 409 });
    }

    if (input.priority === true) {
      if (order.checkoutStarted) {
        return NextResponse.json(
          { message: "Priority cannot change after checkout starts." },
          { status: 409 },
        );
      }
      if (!order.priority) {
        order.priority = true;
        order.priorityFeeCents = Math.round(order.subtotalCents * 0.2);
        order.totalCents = order.subtotalCents + order.priorityFeeCents;
        await order.save();
      }
      return NextResponse.json({ data: toPublicOrder(order) });
    }

    const customer = input.customer;
    if (!customer || typeof customer !== "object") {
      return NextResponse.json({ message: "Invalid contact details." }, { status: 400 });
    }

    const name = String(customer.name ?? "").trim();
    const phone = String(customer.phone ?? "").trim();
    const address = String(customer.address ?? "").trim();
    const email = String(customer.email ?? "").trim().toLowerCase();
    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ message: "Enter a name between 2 and 100 characters." }, { status: 400 });
    }
    if (phone.length < 7 || phone.length > 30) {
      return NextResponse.json({ message: "Enter a valid phone number." }, { status: 400 });
    }
    if (address.length < 5 || address.length > 300) {
      return NextResponse.json({ message: "Enter an address between 5 and 300 characters." }, { status: 400 });
    }
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ message: "Enter a valid email address or leave it blank." }, { status: 400 });
    }

    if (order.checkoutSessionId) {
      const stripe = getStripe();
      const session = await stripe.checkout.sessions.retrieve(order.checkoutSessionId);
      if (session.status === "complete") {
        if (session.payment_status === "paid") {
          markOrderPaid(order);
          order.paymentIntentId = typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id;
          await order.save();
          return NextResponse.json({ message: "Payment completed; order details are locked." }, { status: 409 });
        }
        return NextResponse.json({ message: "Payment is still processing. Contact details cannot be changed yet." }, { status: 409 });
      }
      if (session.status === "open") {
        await stripe.checkout.sessions.expire(session.id);
      }
      order.checkoutSessionId = undefined;
      order.checkoutStarted = false;
    }

    order.customer = { name, phone, address, email, smsOptIn: order.customer.smsOptIn };
    await order.save();
    return NextResponse.json({ data: toPublicOrder(order) });
  } catch (error) {
    console.error("Order update failed:", error.message);
    return NextResponse.json({ message: "Could not update this order." }, { status: 500 });
  }
}

