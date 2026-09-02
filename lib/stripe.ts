import Stripe from "stripe"

let stripe: Stripe | undefined

export function getStripe(): Stripe {
  if (stripe) return stripe

  const secretKey = process.env.STRIPE_SECRET_KEY

  if (!secretKey) {
    throw new Error("Missing STRIPE_SECRET_KEY environment variable")
  }

  stripe = new Stripe(secretKey)
  return stripe
}
