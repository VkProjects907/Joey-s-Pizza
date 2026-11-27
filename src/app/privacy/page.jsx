import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | Joey's Pizza",
  description:
    "How Joey's Pizza collects and uses information in this demo application.",
};

export default function PrivacyPolicyPage() {
  return (
    <article className="space-y-6 px-4 py-8 text-sm leading-7 text-stone-700 sm:px-6">
      <h1 className="text-3xl font-bold text-stone-900">Privacy Policy</h1>
      <p>
        <strong>Joey&apos;s Pizza</strong> operates this pizza ordering
        application as a demonstration project. Last updated: November 26, 2026.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">
          Information we collect
        </h2>
        <p>
          When you place a demo order, we collect the name, delivery address,
          phone number for delivery coordination and order support, email
          address (if provided), order items, order and payment status, and any
          separate SMS consent choice. Providing a phone number for order
          contact does not enroll you in text messages. If you use location
          lookup, the app may receive approximate device location to help fill
          the delivery address.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">
          How we use information
        </h2>
        <p>
          We use order information to create and display the demo order,
          simulate preparation and tracking, provide customer support, and send
          an order confirmation by email or—only when you separately opt in—SMS.
          SMS consent is optional and is not required to order, create an
          account, or use the service. Stripe processes test payment details.
          A phone number entered in Stripe is payment billing information and
          does not enroll you in SMS or change the SMS recipient. If you opt in,
          a text is sent only to the phone number from the order contact form.
          Joey&apos;s Pizza does not store full
          card numbers or security codes in its database.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">
          Service providers and SMS privacy
        </h2>
        <p>
          We use service providers such as MongoDB, Stripe, Resend, Twilio, and
          Netlify to operate the demo, store orders, process test payments,
          deliver messages, and host the website. These providers process
          information as needed to provide their services.
        </p>
        <p>
          <strong>
            We do not sell or share your SMS opt-in data or personal information
            with third parties for marketing purposes.
          </strong>{" "}
          Mobile numbers and SMS consent are not shared with third parties or
          affiliates for their own marketing or promotional purposes.
        </p>
        <p>
          The optional program sends one transactional order confirmation per
          paid demo order. Message frequency is one message per paid order;
          message and data rates may apply. Reply HELP for help or STOP to opt
          out. Choosing not to receive texts does not affect your order or
          account.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">
          Storage and choices
        </h2>
        <p>
          Order information is stored in the application database so an order
          can be confirmed and tracked. Guest contact details may be kept in the
          current browser tab for convenience. You can decline SMS by leaving
          the optional box unchecked, and you can opt out of texts at any time
          by replying STOP.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">Contact</h2>
        <p>
          For privacy questions, contact:{" "}
          <strong>support@joeysartisanpizza.com</strong>.
        </p>
      </section>

      <p>
        <Link className="underline" href="/terms">
          Read the Joey&apos;s Pizza Terms and Conditions.
        </Link>
      </p>
          <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">Accounts</h2>
        <p>If you create an account, we collect your name and email address and store a bcrypt password hash to authenticate you; we do not store your password in plain text. An HTTP-only session cookie keeps you signed in, and orders you create while signed in are linked to your account so you can view their order history. Guest orders remain separate from account orders.</p>
      </section>
    </article>
  );
}
