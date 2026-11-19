import { NextResponse } from "next/server";
import { getCurrentUser } from "../../../../../lib/auth";

export const runtime = "nodejs";

export async function GET() {
  try {
    const user = await getCurrentUser();
    return NextResponse.json({ user }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("Account session lookup failed:", error.message);
    return NextResponse.json({ user: null }, { status: 500, headers: { "Cache-Control": "no-store" } });
  }
}
