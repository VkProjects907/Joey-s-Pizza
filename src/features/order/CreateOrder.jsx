"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";

import { createOrder } from "../../services/apiRestaurant";
import Button from "../../ui/Button";
import EmptyCart from "../cart/EmptyCart";
import { clearCart, getCart, getTotalCartPrice } from "../cart/cartSlice";
import { formatCurrency } from "../../utils/helpers";
import { clearAddress, fetchAddress } from "../user/userSlice";
import { clearGuestContact } from "../../utils/guestContact";

// https://uibakery.io/regex-library/phone-number
const isValidPhone = (str) =>
  /^\+?\d{1,4}?[-.\s]?\(?\d{1,3}?\)?[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}$/.test(
    str,
  );

function CreateOrder() {
  const [withPriority, setWithPriority] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "+1 ", address: "", email: "" });
  const dispatch = useDispatch();

  const {
    status: addressStatus,
    position,
    error: errorAddress,
  } = useSelector((state) => state.user);

  const isLoadingAddress = addressStatus === "loading";

  useEffect(() => {
    clearGuestContact();
    dispatch(clearAddress());
  }, [dispatch]);

  const cart = useSelector(getCart);
  const totalCartPrice = useSelector(getTotalCartPrice);
  const accountName = useSelector((state) => state.user.username);

  const priorityPrice = withPriority ? totalCartPrice * 0.2 : 0;
  const totalPrice = totalCartPrice + priorityPrice;

  async function handleGetPosition(event) {
    event.preventDefault();
    try {
      const result = await dispatch(fetchAddress()).unwrap();
      setContact((current) => current.address ? current : { ...current, address: result.address });
    } catch {
      // The address error is displayed from the Redux state below.
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();

    if (isSubmitting) return;

    setFormErrors({});

    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);

    const order = {
      ...data,
      cart,
      priority: withPriority,
      smsOptIn: data.smsOptIn === "on",
      accountOrderRequested: Boolean(accountName),
    };

    const errors = {};

    if (!isValidPhone(order.phone)) {
      errors.phone =
        "Please give us your correct phone number. We might need it to contact you.";
    }

    if (order.smsOptIn && !/^\+[1-9]\d{7,14}$/.test(String(order.phone).replace(/[\s().-]/g, ""))) {
      errors.phone = "For text updates, enter the phone number in international format, such as +14155552671.";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setIsSubmitting(true);

      const newOrder = await createOrder(order);

      dispatch(clearCart());

      window.location.assign(`/order/${encodeURIComponent(newOrder.id)}/payment`);
    } catch (error) {
      setFormErrors({
        general: error.message || "Something went wrong. Please try again.",
      });

      setIsSubmitting(false);
    }
  }

  if (!cart.length) return <EmptyCart />;

  return (
    <div className="px-4 py-6">
      <h2 className="mb-8 text-xl font-semibold">
        Ready to order? Let&apos;s go!
      </h2>

      <form onSubmit={handleSubmit}>
        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40" htmlFor="customer">
            Full name
          </label>

          <input
            className="input grow"
            type="text"
            name="customer"
            id="customer"
            value={contact.name}
            onChange={(event) => setContact((current) => ({ ...current, name: event.target.value }))}
            required
          />
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40" htmlFor="phone">
            Phone number
          </label>

          <div className="grow">
            <input
              className="input w-full"
              type="tel"
              name="phone"
              id="phone"
              autoComplete="tel"
              placeholder="+1 555 123 4567"
              value={contact.phone}
              onChange={(event) => setContact((current) => ({ ...current, phone: event.target.value }))}
              required
            />
            <p className="mt-1 text-xs text-stone-500">
              Required for delivery coordination and order support. This phone number does not sign you up for text messages; text consent is a separate optional choice below. Enter a different country code if needed.
            </p>

            {formErrors.phone && (
              <p className="mt-2 rounded-md bg-red-100 p-2 text-xs text-red-700">
                {formErrors.phone}
              </p>
            )}
          </div>
        </div>

        <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40" htmlFor="email">
            Email for Stripe checkout (optional)
          </label>
          <input className="input grow" type="email" name="email" id="email" value={contact.email} onChange={(event) => setContact((current) => ({ ...current, email: event.target.value }))} />
        </div>

        <section className="mb-5 rounded-lg border border-stone-300 bg-stone-50 p-4 sm:ml-40" aria-labelledby="sms-consent-heading">
          <h3 id="sms-consent-heading" className="font-semibold text-stone-800">
            Optional text message consent
          </h3>
          <p className="mt-1 text-sm text-stone-600">
            You can place your order, create an account, and use this service without agreeing to texts. Leaving this box unchecked will not affect checkout.
          </p>
          <div className="mt-3 flex items-start gap-3">
            <input
              className="mt-1 h-4 w-4 shrink-0 accent-yellow-400 focus:outline-none focus:ring focus:ring-yellow-400 focus:ring-offset-2"
              type="checkbox"
              name="smsOptIn"
              id="smsOptIn"
              defaultChecked={false}
            />
            <label htmlFor="smsOptIn" className="text-sm text-stone-700">
            Yes, I want Joey&apos;s Pizza to text me one transactional confirmation for each paid order at the phone number entered above. This is optional and is not a condition of purchase. A phone number entered in Stripe is only for payment billing and will not change the SMS recipient.
            </label>
          </div>
          <p className="mt-2 text-xs leading-5 text-stone-600">
            Message frequency: one message per paid order. Message and data rates may apply. Reply HELP for help or STOP to opt out. See the{" "}
            <Link className="underline" href="/terms">Terms and Conditions</Link> and{" "}
            <Link className="underline" href="/privacy">Privacy Policy</Link>.
          </p>
        </section>

        <div className="relative mb-5 flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="sm:basis-40" htmlFor="address">
            Address
          </label>

          <div className="grow">
            <input
              className="input w-full"
              type="text"
              name="address"
              id="address"
              disabled={isLoadingAddress}
              value={contact.address}
              onChange={(event) => setContact((current) => ({ ...current, address: event.target.value }))}
              required
            />

            {addressStatus === "error" && (
              <p className="mt-2 rounded-md bg-red-100 p-2 text-xs text-red-700">
                {errorAddress}
              </p>
            )}
          </div>

          {(!position.latitude || !position.longitude) && (
            <span className="absolute right-[3px] top-[3px] z-50 md:right-[5px] md:top-[5px]">
              <Button
                disabled={isLoadingAddress}
                type="small"
                onClick={handleGetPosition}
              >
                Get position
              </Button>
            </span>
          )}
        </div>

        <div className="mb-12 flex items-center gap-5">
          <input
            className="h-6 w-6 accent-yellow-400 focus:outline-none focus:ring focus:ring-yellow-400 focus:ring-offset-2"
            type="checkbox"
            id="priority"
            checked={withPriority}
            onChange={(e) => setWithPriority(e.target.checked)}
          />

          <label htmlFor="priority" className="font-medium">
            Would you like to give your order priority?
          </label>
        </div>

        {formErrors.general && (
          <p className="mb-4 rounded-md bg-red-100 p-3 text-sm text-red-700">
            {formErrors.general}
          </p>
        )}

        <div>
          <input
            type="hidden"
            name="position"
            value={
              position.latitude != null && position.longitude != null
                ? `${position.latitude},${position.longitude}`
                : ""
            }
          />

          <Button
            disabled={isSubmitting || isLoadingAddress}
            type="primary"
            htmlType="submit"
          >
            {isSubmitting
              ? "Placing order..."
              : `Order now from ${formatCurrency(totalPrice)}`}
          </Button>
        </div>
      </form>
    </div>
  );
}

export default CreateOrder;




