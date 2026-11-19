import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import { getTrackedOrder, hashAccessToken, toPublicOrder } from "../../../../../lib/orders";
import Order from "../../../../../models/Order";

export const runtime = "nodejs";

export async function GET(_request, { params }) {
  try {
    const { accessToken } = await params;
    const order = await getTrackedOrder(accessToken);
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }
    return NextResponse.json({ data: order });
  } catch {
    return NextResponse.json({ message: "Could not load this order." }, { status: 500 });
  }
}

export async function PATCH(request, { params }) {
  try {
    const { accessToken } = await params;
    const input = await request.json();
    if (input.priority !== true || !/^[a-f0-9]{64}$/i.test(accessToken)) {
      return NextResponse.json({ message: "Invalid order update." }, { status: 400 });
    }

    await connectDB();
    const order = await Order.findOne({ accessTokenHash: hashAccessToken(accessToken) });
    if (!order) {
      return NextResponse.json({ message: "Order not found." }, { status: 404 });
    }

    if (!order.priority) {
      order.priority = true;
      order.priorityFeeCents = Math.round(order.subtotalCents * 0.2);
      order.totalCents = order.subtotalCents + order.priorityFeeCents;
      await order.save();
    }

    return NextResponse.json({ data: toPublicOrder(order) });
  } catch {
    return NextResponse.json({ message: "Could not update this order." }, { status: 500 });
  }
}
