"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "../../ui/Button";
import { saveGuestContact } from "../../utils/guestContact";

export default function EditOrderContact({ accessToken, initialCustomer }) {
  const [customer, setCustomer] = useState({
    name: initialCustomer?.name ?? "",
    phone: initialCustomer?.phone ?? "",
    address: initialCustomer?.address ?? "",
    email: initialCustomer?.email ?? "",
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  function updateField(event) {
    setCustomer((current) => ({ ...current, [event.target.name]: event.target.value }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch(`/api/orders/${accessToken}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ customer }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message || "Could not save contact details.");
      saveGuestContact(customer);
      setMessage("Contact details saved. Stripe checkout will use the updated email.");
      router.refresh();
    } catch (saveError) {
      setError(saveError.message || "Could not save contact details.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <details className="rounded-lg border border-stone-300 bg-white p-4 shadow-sm">
      <summary className="cursor-pointer font-semibold">Edit contact information</summary>
      <form className="mt-4 space-y-4" onSubmit={handleSubmit}>
        <p className="text-sm text-stone-600">
          Update the delivery contact and email for your order. Stripe's collected phone is saved to the order after payment;
          the email is prefilled in Stripe and synchronized back after a successful payment. To change it, update it here before checkout. Saving
          changes closes any open checkout session.
        </p>
        <label className="block text-sm font-medium">
          Full name
          <input className="input mt-1 w-full" name="name" value={customer.name} onChange={updateField} required minLength={2} maxLength={100} />
        </label>
        <label className="block text-sm font-medium">
          Delivery phone
          <input className="input mt-1 w-full" name="phone" type="tel" value={customer.phone} onChange={updateField} required minLength={7} maxLength={30} />
        </label>
        <label className="block text-sm font-medium">
          Email for Stripe checkout (optional)
          <input className="input mt-1 w-full" name="email" type="email" value={customer.email} onChange={updateField} maxLength={254} />
        </label>
        <label className="block text-sm font-medium">
          Delivery address
          <input className="input mt-1 w-full" name="address" value={customer.address} onChange={updateField} required minLength={5} maxLength={300} />
        </label>
        {message && <p role="status" className="text-sm text-green-700">{message}</p>}
        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
        <Button type="primary" disabled={isSaving} htmlType="submit">
          {isSaving ? "Saving..." : "Save contact information"}
        </Button>
      </form>
    </details>
  );
}






