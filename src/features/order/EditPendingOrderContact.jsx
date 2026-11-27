"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Button from "../../ui/Button";
import { formatCurrency } from "../../utils/helpers";

export default function EditPendingOrderContact({ accessToken, order }) {
  const [customer, setCustomer] = useState({
    name: order.customer?.name || "",
    phone: order.customer?.phone || "+1 ",
    address: order.customer?.address || "",
    email: order.customer?.email || "",
  });
  const [smsOptIn, setSmsOptIn] = useState(false);
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const router = useRouter();

  function updateField(event) {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSaving) return;
    setError("");
    setIsSaving(true);

    try {
      const response = await fetch(`/api/orders/${encodeURIComponent(accessToken)}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer: { ...customer, smsOptIn } }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save contact information.");
      router.replace(`/order/${encodeURIComponent(accessToken)}/payment`);
      router.refresh();
    } catch (saveError) {
      setError(saveError.message || "Could not save contact information.");
      setIsSaving(false);
    }
  }

  return (
    <section className="space-y-6 px-4 py-8 sm:px-6">
      <div>
        <p className="text-sm font-semibold text-amber-700">Checkout details</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-stone-900">Update contact information</h1>
        <p className="mt-2 text-sm text-stone-600">Your cart and order total are preserved. Save the changes to return to payment.</p>
      </div>

      <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
        <ul className="divide-y divide-stone-100">
          {order.cart.map((item) => (
            <li key={item.pizzaId} className="flex justify-between gap-4 py-3 text-sm">
              <span className="text-stone-700">{item.quantity}× {item.name}</span>
              <span className="font-medium text-stone-900">{formatCurrency(item.totalPrice)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-2 flex justify-between border-t border-stone-200 pt-3 font-bold text-stone-900">
          <span>Order total</span>
          <span>{formatCurrency(order.orderPrice + order.priorityPrice)}</span>
        </div>
      </div>

      <form className="max-w-2xl space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-stone-700">
          Full name
          <input className="input mt-1 w-full" name="name" value={customer.name} onChange={updateField} required minLength={2} maxLength={100} />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Phone number
          <input className="input mt-1 w-full" name="phone" type="tel" autoComplete="tel" value={customer.phone} onChange={updateField} required minLength={7} maxLength={30} />
          <span className="mt-1 block text-xs font-normal text-stone-500">For delivery coordination and order support. This number is not SMS consent.</span>
        </label>
        <section className="rounded-lg border border-stone-300 bg-stone-50 p-4" aria-labelledby="edit-sms-consent-heading">
          <h2 id="edit-sms-consent-heading" className="font-semibold text-stone-800">Optional text message consent</h2>
          <p className="mt-1 text-sm text-stone-600">You can save these changes and continue to payment without agreeing to texts.</p>
          <div className="mt-3 flex items-start gap-3">
            <input className="mt-1 h-4 w-4 shrink-0 accent-yellow-400" type="checkbox" id="editSmsOptIn" checked={smsOptIn} onChange={(event) => setSmsOptIn(event.target.checked)} />
            <label htmlFor="editSmsOptIn" className="text-sm text-stone-700">Yes, I want Joey&apos;s Pizza to text me one transactional confirmation for this paid order. This is optional and is not a condition of purchase.</label>
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-600">Message frequency: one message for this paid order. Message and data rates may apply. Reply HELP for help or STOP to opt out. See the <Link className="underline" href="/terms">Terms and Conditions</Link> and <Link className="underline" href="/privacy">Privacy Policy</Link>.</p>
        </section>
        <label className="block text-sm font-medium text-stone-700">
          Email for Stripe checkout (optional)
          <input className="input mt-1 w-full" name="email" type="email" autoComplete="email" value={customer.email} onChange={updateField} maxLength={254} />
        </label>
        <label className="block text-sm font-medium text-stone-700">
          Delivery address
          <input className="input mt-1 w-full" name="address" autoComplete="street-address" value={customer.address} onChange={updateField} required minLength={5} maxLength={300} />
        </label>
        {error && <p role="alert" className="rounded-md bg-red-100 p-3 text-sm text-red-700">{error}</p>}
        <Button type="primary" htmlType="submit" disabled={isSaving}>
          {isSaving ? "Saving..." : "Save and return to payment"}
        </Button>
      </form>
    </section>
  );
}
