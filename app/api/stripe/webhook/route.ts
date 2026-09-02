import { createClient } from "@supabase/supabase-js"
import { getStripe } from "@/lib/stripe"

export async function POST(request: Request) {
  const signature = request.headers.get("stripe-signature")
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!signature || !webhookSecret) {
    return new Response("Webhook signature is missing", { status: 400 })
  }

  let event
  try {
    const payload = await request.text()
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error) {
    console.error("[stripe] invalid webhook signature", error)
    return new Response("Invalid webhook signature", { status: 400 })
  }

  if (
    event.type !== "checkout.session.completed" &&
    event.type !== "checkout.session.async_payment_succeeded"
  ) {
    return new Response("Ignored", { status: 200 })
  }

  const session = event.data.object
  const { username, website_url: websiteUrl, bid: bidValue } = session.metadata ?? {}
  const bid = Number(bidValue)

  if (!username || !websiteUrl || !Number.isSafeInteger(bid) || bid <= 0) {
    return new Response("Invalid checkout metadata", { status: 400 })
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("[stripe] missing Supabase server environment variables")
    return new Response("Server configuration error", { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
  const { error } = await supabase.from("entries").insert({
    username,
    website_url: websiteUrl,
    bid,
    stripe_checkout_session_id: session.id,
  })

  if (!error || error.code === "23505") {
    return new Response("Received", { status: 200 })
  }

  console.error("[stripe] bid rejected by Supabase; issuing refund", error)
  const paymentIntent = session.payment_intent
  if (typeof paymentIntent !== "string") {
    console.error("[stripe] rejected bid has no payment intent to refund")
    return new Response("Refund failed", { status: 500 })
  }

  try {
    await getStripe().refunds.create({ payment_intent: paymentIntent })
  } catch (refundError) {
    console.error("[stripe] failed to refund rejected bid", refundError)
    return new Response("Refund failed", { status: 500 })
  }

  return new Response("Bid rejected and refunded", { status: 200 })
}
