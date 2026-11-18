import Stripe from "stripe";

export function getStripe() {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey || !secretKey.startsWith("sk_test_")) {
    throw new Error("Stripe test mode requires an sk_test_ secret key.");
  }
  return new Stripe(secretKey);
}
