import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import { createSession, isValidEmail } from "../../../../../lib/auth";
import User from "../../../../../models/User";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const input = await request.json();
    const email = String(input.email ?? "").trim().toLowerCase();
    const password = String(input.password ?? "");
    if (email.length > 254 || !isValidEmail(email) || !password || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email }).select("+passwordHash name email");
    const passwordMatches = user ? await bcrypt.compare(password, user.passwordHash) : false;
    if (!user || !passwordMatches) {
      return NextResponse.json({ message: "Email or password is incorrect." }, { status: 401 });
    }

    await createSession(user._id);
    return NextResponse.json({ user: { id: String(user._id), name: user.name, email: user.email } });
  } catch (error) {
    console.error("Account login failed:", error.message);
    return NextResponse.json({ message: "We could not sign you in. Please try again." }, { status: 500 });
  }
}
