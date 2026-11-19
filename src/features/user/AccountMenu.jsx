"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { clearAddress, updateName } from "./userSlice";
import { clearCart } from "../cart/cartSlice";
import { clearGuestContact } from "../../utils/guestContact";
import { usePathname } from "next/navigation";

export default function AccountMenu() {
  const [user, setUser] = useState(null);
  const [loaded, setLoaded] = useState(false);
  const dispatch = useDispatch();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    setLoaded(false);
    fetch("/api/auth/session", { cache: "no-store" })
      .then((response) => {
        if (!response.ok) throw new Error("Could not read the current session.");
        return response.json();
      })
      .then(({ user: currentUser }) => {
        if (!active) return;
        setUser(currentUser);
        dispatch(updateName(currentUser?.name || ""));
      })
      .catch(() => {
        if (!active) return;
        setUser(null);
        dispatch(updateName(""));
      })
      .finally(() => { if (active) setLoaded(true); });
    return () => { active = false; };
  }, [dispatch, pathname]);

  async function handleLogout() {
    const response = await fetch("/api/auth/logout", { method: "POST" });
    if (!response.ok) return;
    setUser(null);
    dispatch(updateName(""));
    dispatch(clearCart());
    dispatch(clearAddress());
    clearGuestContact();
    window.location.replace("/");
  }

  return (
    <nav aria-label="Account" className="flex shrink-0 items-center gap-2 text-xs tracking-normal sm:gap-3">
      {!loaded ? null : user ? (
        <>
          <Link href="/account" className="rounded-lg px-3 py-2 font-medium text-stone-700 hover:bg-stone-100">Account</Link>
          <button type="button" className="rounded-lg border border-stone-300 px-3 py-2 font-medium text-stone-700 hover:bg-stone-100" onClick={handleLogout}>Sign out</button>
        </>
      ) : (
        <>
          <Link href="/login" className="rounded-lg px-3 py-2 font-medium text-stone-700 hover:bg-stone-100">Sign in</Link>
          <Link href="/signup" className="rounded-lg bg-stone-900 px-3 py-2 font-medium text-white hover:bg-stone-700"><span className="sm:hidden">Join</span><span className="hidden sm:inline">Create account</span></Link>
        </>
      )}
    </nav>
  );
}
