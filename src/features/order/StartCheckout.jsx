"use client";

import { useState } from "react";
import Button from "../../ui/Button";

export default function StartCheckout({ accessToken, checkoutStarted }) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleCheckout() {
    if (isLoading) return;
    setIsLoading(true);
    setError("");

    try {
      const response = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not start checkout.");
      window.location.assign(result.url);
    } catch (checkoutError) {
      setError(checkoutError.message || "Could not start test checkout.");
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-3 text-right">
      {error && (
        <p role="alert" className="rounded-md bg-red-100 p-3 text-left text-sm text-red-700">
          {error}
        </p>
      )}
      <Button type="primary" onClick={handleCheckout} disabled={isLoading}>
        {isLoading
          ? "Opening secure checkout..."
          : checkoutStarted
            ? "Continue to test checkout"
            : "Pay with Stripe test card"}
      </Button>
      <p className="text-xs text-stone-500">Test mode only. No real card charges.</p>
    </div>
  );
}
