import { NextResponse } from "next/server";
import { destroySession } from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function POST() {
  try {
    await destroySession();
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Account logout failed:", error.message);
    return NextResponse.json({ message: "We could not sign you out. Please try again." }, { status: 500 });
  }
}
