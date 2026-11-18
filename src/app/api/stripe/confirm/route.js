import { NextResponse } from "next/server";
import { confirmPaymentIntent } from "../../../../../lib/orders";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { accessToken, paymentIntentId } = await request.json();
    const confirmed = await confirmPaymentIntent(accessToken, paymentIntentId);
    if (!confirmed) {
      return NextResponse.json({ message: "Payment is still being confirmed." }, { status: 409 });
    }
    return NextResponse.json({ confirmed: true });
  } catch (error) {
    console.error("Payment confirmation verification failed:", error.message);
    return NextResponse.json({ message: "Could not verify this payment." }, { status: 500 });
  }
}
