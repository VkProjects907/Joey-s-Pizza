import { randomBytes } from "node:crypto";
import { NextResponse } from "next/server";
import { cleanupUnpaidOrders, hashAccessToken } from "../../../../lib/orders";
import Order from "../../../../models/Order";
import { getMenu } from "../../../services/apiRestaurant";
import { getCurrentUser } from "../../../../lib/auth";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const input = await request.json();
    const currentUser = await getCurrentUser();
    const accountOrderRequested = input.accountOrderRequested === true;
    if (accountOrderRequested && !currentUser) {
      return NextResponse.json(
        { message: "Your account session expired. Please sign in again before placing this order." },
        { status: 401 },
      );
    }
    const customerName = String(input.customer ?? "").trim();
    const phone = String(input.phone ?? "").trim();
    const address = String(input.address ?? "").trim();
    const email = String(input.email ?? "").trim().toLowerCase();
    const smsOptIn = input.smsOptIn === true || input.smsOptIn === "true";

    if (customerName.length < 2 || customerName.length > 100) {
      return NextResponse.json({ message: "Enter a valid name." }, { status: 400 });
    }
    if (phone.length < 7 || phone.length > 30) {
      return NextResponse.json({ message: "Enter a valid phone number." }, { status: 400 });
    }
    const normalizedSmsPhone = phone.replace(/[\s().-]/g, "");
    if (smsOptIn && !/^\+[1-9]\d{7,14}$/.test(normalizedSmsPhone)) {
      return NextResponse.json(
        { message: "For text updates, enter the phone number in international format, such as +14155552671." },
        { status: 400 },
      );
    }
    if (email && (email.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }
    if (address.length < 5 || address.length > 300) {
      return NextResponse.json({ message: "Enter a valid delivery address." }, { status: 400 });
    }
    if (!Array.isArray(input.cart) || input.cart.length === 0 || input.cart.length > 30) {
      return NextResponse.json({ message: "Your cart is empty or invalid." }, { status: 400 });
    }

    const menu = await getMenu();
    const menuById = new Map(menu.map((item) => [String(item.id), item]));
    const items = [];

    for (const cartItem of input.cart) {
      const menuItem = menuById.get(String(cartItem.pizzaId));
      const quantity = Number(cartItem.quantity);

      if (!menuItem || menuItem.soldOut || !Number.isInteger(quantity) || quantity < 1 || quantity > 20) {
        return NextResponse.json({ message: "One or more cart items are invalid." }, { status: 400 });
      }

      const unitPriceCents = Math.round(Number(menuItem.unitPrice) * 100);
      if (!Number.isSafeInteger(unitPriceCents) || unitPriceCents < 0) {
        return NextResponse.json({ message: "A menu item has an invalid price." }, { status: 502 });
      }

      items.push({
        pizzaId: String(menuItem.id),
        name: String(menuItem.name),
        quantity,
        unitPriceCents,
      });
    }

    const subtotalCents = items.reduce(
      (total, item) => total + item.unitPriceCents * item.quantity,
      0,
    );
    const priority = input.priority === true;
    const priorityFeeCents = priority ? Math.round(subtotalCents * 0.2) : 0;
    const rawPosition = String(input.position ?? "").split(",").map(Number);
    const position = rawPosition.length === 2 && rawPosition.every(Number.isFinite)
      ? { latitude: rawPosition[0], longitude: rawPosition[1] }
      : undefined;
    const accessToken = randomBytes(32).toString("hex");
    const orderNumber = randomBytes(10).toString("hex").toUpperCase();
    await cleanupUnpaidOrders();
    const order = await Order.create({
      orderNumber,
      accessTokenHash: hashAccessToken(accessToken),
      userId: currentUser?.id || null,
      customer: {
        name: customerName,
        phone: smsOptIn ? normalizedSmsPhone : phone,
        smsPhone: smsOptIn ? normalizedSmsPhone : undefined,
        address,
        email,
        smsOptIn,
      },
      position,
      items,
      priority,
      subtotalCents,
      priorityFeeCents,
      totalCents: subtotalCents + priorityFeeCents,
      currency: "USD",
      paymentStatus: "pending",
      orderStatus: "pending_payment",
      pendingExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return NextResponse.json(
      { id: accessToken, orderNumber: order.orderNumber, accountOrderLinked: Boolean(currentUser) },
      { status: 201 },
    );
  } catch (error) {
    console.error("Order creation failed:", error.message);
    return NextResponse.json(
      { message: "We could not save your order. Please try again." },
      { status: 500 },
    );
  }
}


