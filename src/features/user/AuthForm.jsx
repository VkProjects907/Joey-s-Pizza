"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useDispatch } from "react-redux";
import { clearAddress, updateName } from "./userSlice";
import { clearCart } from "../cart/cartSlice";
import { clearGuestContact } from "../../utils/guestContact";

function AuthForm({ mode }) {
  const isSignup = mode === "register";
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();
  const dispatch = useDispatch();

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    setError("");
    setIsSubmitting(true);

    const values = Object.fromEntries(new FormData(event.currentTarget));
    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Authentication failed.");

      dispatch(updateName(result.user.name));
      dispatch(clearCart());
      dispatch(clearAddress());
      clearGuestContact();
      router.push("/account");
      router.refresh();
    } catch (submitError) {
      setError(submitError.message || "Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      {isSignup && (
        <div className="flex flex-col gap-2">
          <label htmlFor="name">Name</label>
          <input className="input" id="name" name="name" autoComplete="name" minLength={2} maxLength={100} required />
        </div>
      )}
      <div className="flex flex-col gap-2">
        <label htmlFor="email">Email</label>
        <input className="input" id="email" name="email" type="email" autoComplete="email" maxLength={254} required />
      </div>
      <div className="flex flex-col gap-2">
        <label htmlFor="password">Password</label>
        <input className="input" id="password" name="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={isSignup ? 12 : undefined} maxLength={72} required />
        {isSignup && <p className="text-xs text-stone-500">Use at least 12 characters. Maximum: 72 UTF-8 bytes.</p>}
      </div>
      {error && <p role="alert" className="rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</p>}
      <button className="rounded-full bg-yellow-400 px-6 py-3 text-sm font-semibold uppercase tracking-wide text-stone-800 hover:bg-yellow-300 disabled:cursor-not-allowed disabled:opacity-60" type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Please wait…" : isSignup ? "Create account" : "Sign in"}
      </button>
      <p className="text-sm text-stone-600">
        {isSignup ? "Already have an account? " : "New here? "}
        <Link className="underline" href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link>
      </p>
    </form>
  );
}

export default AuthForm;
