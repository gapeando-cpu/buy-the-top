import { createClient } from "@/lib/supabase/client"

export type Player = {
  username: string
  amount: number
  url?: string
}

export function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.amount - a.amount)
}

export function formatMoney(amount: number): string {
  return "$" + amount.toLocaleString("en-US")
}

// Load all entries from Supabase, highest bid first.
export async function fetchPlayers(): Promise<Player[]> {
  const supabase = createClient()
  const { data, error } = await supabase
    .from("entries")
    .select("username, website_url, bid")
    .order("bid", { ascending: false })

  if (error) throw error

  return (data ?? []).map((row) => ({
    username: row.username as string,
    amount: Number(row.bid),
    url: (row.website_url as string | null) ?? undefined,
  }))
}

// Save a new bid through the atomic database function.
export async function addPlayer(player: Player): Promise<Player> {
  const supabase = createClient()

  const { data, error } = await supabase.rpc("place_bid", {
    p_username: player.username,
    p_website_url: player.url ?? null,
    p_bid: player.amount,
  })

  if (error) throw error

  const row = Array.isArray(data) ? data[0] : data
  if (!row) throw new Error("Bid was accepted but no entry was returned")

  return {
    username: String(row.username),
    amount: Number(row.bid),
    url: (row.website_url as string | null) ?? undefined,
  }
}
