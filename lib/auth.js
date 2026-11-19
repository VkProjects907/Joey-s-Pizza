import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import connectDB from "./mongodb";
import Session from "../models/Session";
import User from "../models/User";

const SESSION_COOKIE = "joeys_pizza_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;

function hashSessionToken(token) {
  return createHash("sha256").update(token).digest("hex");
}

export async function createSession(userId) {
  await connectDB();
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_SECONDS * 1000);

  await Session.create({ userId, tokenHash: hashSessionToken(token), expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    expires: expiresAt,
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token && /^[A-Za-z0-9_-]{40,50}$/.test(token)) {
    await connectDB();
    await Session.deleteOne({ tokenHash: hashSessionToken(token) });
  }

  cookieStore.delete(SESSION_COOKIE);
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token || !/^[A-Za-z0-9_-]{40,50}$/.test(token)) return null;

  await connectDB();
  const session = await Session.findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
  }).select("userId").lean();

  if (!session) return null;
  const user = await User.findById(session.userId).select("name email").lean();
  if (!user) return null;

  return { id: String(user._id), name: user.name, email: user.email };
}

export function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}
