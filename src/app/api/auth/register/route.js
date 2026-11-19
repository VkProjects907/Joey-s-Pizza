import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import connectDB from "../../../../../lib/mongodb";
import { createSession, isValidEmail } from "../../../../../lib/auth";
import User from "../../../../../models/User";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const input = await request.json();
    const name = String(input.name ?? "").trim();
    const email = String(input.email ?? "").trim().toLowerCase();
    const password = String(input.password ?? "");

    if (name.length < 2 || name.length > 100) {
      return NextResponse.json({ message: "Enter a name between 2 and 100 characters." }, { status: 400 });
    }
    if (email.length > 254 || !isValidEmail(email)) {
      return NextResponse.json({ message: "Enter a valid email address." }, { status: 400 });
    }
    if (password.length < 12 || Buffer.byteLength(password, "utf8") > 72) {
      return NextResponse.json({ message: "Use a password between 12 and 72 bytes." }, { status: 400 });
    }

    await connectDB();
    const existingUser = await User.findOne({ email }).select("_id").lean();
    if (existingUser) {
      return NextResponse.json({ message: "An account with that email already exists." }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, passwordHash });
    await createSession(user._id);

    return NextResponse.json({ user: { id: String(user._id), name: user.name, email: user.email } }, { status: 201 });
  } catch (error) {
    if (error?.code === 11000) {
      return NextResponse.json({ message: "An account with that email already exists." }, { status: 409 });
    }
    console.error("Account registration failed:", error.message);
    return NextResponse.json({ message: "We could not create your account. Please try again." }, { status: 500 });
  }
}
