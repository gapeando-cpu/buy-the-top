import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getStripe } from "@/lib/stripe"

const usernamePattern = /^[A-Za-z0-9_-]+$/

function getAdminSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase server environment variables")
  }

  return createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const username = typeof body.username === "string" ? body.username.trim() : ""
    const websiteUrl = typeof body.url === "string" ? body.url.trim() : ""
    const bid = typeof body.bid === "number" ? body.bid : Number(body.bid)

    if (!username || username.length > 30 || !usernamePattern.test(username)) {
      return NextResponse.json(
        { error: "Username must be 1-30 characters: letters, numbers, _ or -." },
        { status: 400 },
      )
    }

    let parsedUrl: URL
    try {
      parsedUrl = new URL(websiteUrl)
    } catch {
      return NextResponse.json({ error: "Please enter a valid website URL." }, { status: 400 })
    }

    if (
      !["http:", "https:"].includes(parsedUrl.protocol) ||
      !parsedUrl.hostname ||
      /\s/.test(parsedUrl.hostname)
    ) {
      return NextResponse.json({ error: "Please enter a valid website URL." }, { status: 400 })
    }

    if (!Number.isSafeInteger(bid) || bid <= 0) {
      return NextResponse.json({ error: "Your payment must be a positive whole dollar amount." }, { status: 400 })
    }

    const supabase = getAdminSupabase()
    const { data: topEntry, error: topError } = await supabase
      .from("entries")
      .select("bid")
      .order("bid", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (topError) throw topError

    const currentTop = Number(topEntry?.bid ?? 0)
    if (bid <= currentTop) {
      return NextResponse.json(
        { error: `Your payment must be higher than $${currentTop.toLocaleString("en-US")}.` },
        { status: 409 },
      )
    }

    const session = await getStripe().checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: { name: "Buy the Top — Leaderboard Placement" },
            unit_amount: bid * 100,
          },
          quantity: 1,
        },
      ],
      metadata: {
        username,
        website_url: parsedUrl.toString(),
        bid: String(bid),
        payment_type: "leaderboard_placement",
      },
      success_url: `${new URL(request.url).origin}/?checkout=success`,
      cancel_url: `${new URL(request.url).origin}/?checkout=cancelled`,
    })

    if (!session.url) throw new Error("Stripe did not return a Checkout URL")
    return NextResponse.json({ url: session.url })
  } catch (error) {
    console.error("[stripe] failed to create checkout session", error)
    return NextResponse.json(
      { error: "Unable to open secure checkout. Please try again." },
      { status: 500 },
    )
  }
}
