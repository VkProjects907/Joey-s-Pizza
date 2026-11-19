import Link from "next/link";

export const metadata = {
  title: "Terms and Conditions | Joey's Pizza",
  description:
    "Terms for using Joey's Pizza and its optional order confirmation text program.",
};

export default function TermsPage() {
  return (
    <article className="space-y-6 px-4 py-8 text-sm leading-7 text-stone-700 sm:px-6">
      <h1 className="text-3xl font-bold text-stone-900">
        Terms and Conditions
      </h1>
      <p>
        <strong>Joey&apos;s Pizza Demo</strong> is a demonstration pizza
        ordering application. Last updated: November 17, 2026.
      </p>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">
          Demo service and payments
        </h2>
        <p>
          The site simulates ordering, payment, and order tracking for
          demonstration purposes. Payments are processed using Stripe test mode.
          Demo orders do not represent a real pizza purchase, and no real food
          delivery is offered through this demo.
        </p>
      </section>

      <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">
          Optional order confirmation texts
        </h2>
        <p>
          The Joey&apos;s Pizza Order Confirmation program sends one
          transactional SMS order confirmation for each paid demo order when the
          customer checks the optional SMS consent box. Consent is not a
          condition of purchase. Message and data rates may apply. Message
          frequency is one message per paid order.{" "}
          <strong>Reply STOP to opt out at any time or HELP for help.</strong>{" "}
          To request support, contact{" "}
          <strong>support@joeysartisanpizza.com</strong>.
        </p>
        <p>
          Wireless carriers are not liable for delayed or undelivered messages.
          Delivery depends on carrier and device availability.
        </p>
        <p>
          Read our{" "}
          <Link className="underline" href="/privacy">
            Privacy Policy
          </Link>{" "}
          for details on how information is handled.
        </p>
      </section>
          <section className="space-y-2">
        <h2 className="text-xl font-semibold text-stone-900">Accounts</h2>
        <p>You may create an account to review orders placed while signed in. Keep your password private and sign out when using a shared device. Orders placed as a guest are not automatically added to an account.</p>
      </section>
    </article>
  );
}
