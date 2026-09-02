import { createClient } from "@/lib/supabase/client"

export type Player = {
  username: string
  amount: number
  url?: string
}

type LeaderboardRow = {
  username: string
  website_url: string | null
  bid: number
}

export function sortPlayers(players: Player[]): Player[] {
  return [...players].sort((a, b) => b.amount - a.amount)
}

export function formatMoney(amount: number): string {
  return "$" + amount.toLocaleString("en-US")
}

export async function fetchPlayers(): Promise<Player[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("entries")
    .select("username, website_url, bid")
    .order("bid", { ascending: false })

  if (error) {
    throw error
  }

  return (data as LeaderboardRow[] | null ?? []).map((row) => ({
    username: String(row.username),
    amount: Number(row.bid),
    url: row.website_url
      ? String(row.website_url)
      : undefined,
  }))
}
