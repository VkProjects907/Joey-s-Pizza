"use client";

import { useEffect, useState } from "react";
import { Elements, PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import { formatCurrency } from "../../utils/helpers";

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const isTestPublishableKey = publishableKey?.startsWith("pk_test_") || false;
const stripePromise = isTestPublishableKey ? loadStripe(publishableKey) : null;

function PaymentForm({ accessToken, clientSecret, customer, totalCents }) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isPaying, setIsPaying] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    if (!stripe || !elements || isPaying) return;

    setIsPaying(true);
    setErrorMessage("");
    try {
      const { error: submitError } = await elements.submit();
      if (submitError) throw submitError;

      const returnUrl = `${window.location.origin}/order/${encodeURIComponent(accessToken)}/confirmation`;
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: { return_url: returnUrl },
        redirect: "if_required",
      });
      if (error) {
        window.location.assign(`/order/${encodeURIComponent(accessToken)}/failed`);
        return;
      }

      if (paymentIntent?.status === "succeeded") {
        const response = await fetch("/api/stripe/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken, paymentIntentId: paymentIntent.id }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Payment is still being confirmed.");
        router.replace(returnUrl);
        router.refresh();
      } else if (paymentIntent?.status === "processing") {
        router.replace(returnUrl);
        router.refresh();
      } else {
        window.location.assign(`/order/${encodeURIComponent(accessToken)}/failed`);
      }
    } catch (error) {
      setErrorMessage(error.message || "Could not complete test payment.");
      setIsPaying(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <PaymentElement
        options={{
          layout: "accordion",
          defaultValues: {
            billingDetails: {
              name: customer?.name || "",
              email: customer?.email || "",
              phone: customer?.phone || "",
            },
          },
          wallets: { applePay: "never", googlePay: "never", link: "never" },
          fields: {
            billingDetails: {
              name: "auto",
              email: "auto",
              phone: "auto",
              address: "if_required",
            },
          },
        }}
      />
      {errorMessage && <p role="alert" className="rounded-md bg-red-100 p-3 text-sm text-red-700">{errorMessage}</p>}
      <Button type="primary" htmlType="submit" disabled={!stripe || isPaying}>
        {isPaying ? "Processing test payment..." : `Pay ${formatCurrency(totalCents / 100)} in test mode`}
      </Button>
      <p className="text-xs text-stone-500">Contact details are prefilled from your order and remain editable. Wallet autofill is disabled for this demo checkout.</p>
    </form>
  );
}

export default function StripePaymentForm({ accessToken, customer, totalCents }) {
  const [clientSecret, setClientSecret] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [retryAttempt, setRetryAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    async function createIntent() {
      setErrorMessage("");
      try {
        const response = await fetch("/api/stripe/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ accessToken }),
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.message || "Could not open test payment.");
        if (result.alreadyPaid) {
          window.location.replace(`/order/${encodeURIComponent(accessToken)}/confirmation`);
          return;
        }
        if (!result.clientSecret) throw new Error("Stripe did not return a payment form.");
        if (active) setClientSecret(result.clientSecret);
      } catch (error) {
        if (active) setErrorMessage(error.message || "Could not open test payment.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    createIntent();
    return () => { active = false; };
  }, [accessToken, retryAttempt]);

  if (!isTestPublishableKey) {
    return <p role="alert" className="rounded-md bg-red-100 p-3 text-sm text-red-700">Add NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_... to .env.local and restart the dev server.</p>;
  }
  if (isLoading) return <p className="text-sm text-stone-600">Preparing secure test payment…</p>;
  if (errorMessage) {
    return (
      <div className="space-y-3">
        <p role="alert" className="rounded-md bg-red-100 p-3 text-sm text-red-700">{errorMessage}</p>
        <button type="button" className="rounded-lg border border-stone-300 bg-white px-4 py-2.5 text-sm font-semibold text-stone-800 hover:bg-stone-50" onClick={() => { setIsLoading(true); setRetryAttempt((attempt) => attempt + 1); }}>
          Try loading payment again
        </button>
      </div>
    );
  }
  if (!clientSecret) return null;

  return (
    <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe" } }}>
      <PaymentForm accessToken={accessToken} clientSecret={clientSecret} customer={customer} totalCents={totalCents} />
    </Elements>
  );
}
