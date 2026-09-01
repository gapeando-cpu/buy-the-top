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

export async function fetchPlayers(): Promise<Player[]> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("entries")
    .select("username, website_url, bid")
    .order("bid", { ascending: false })

  if (error) {
    throw error
  }

  return (data ?? []).map((row) => ({
    username: String(row.username),
    amount: Number(row.bid),
    url: row.website_url
      ? String(row.website_url)
      : undefined,
  }))
}

export async function addPlayer(player: Player): Promise<Player> {
  const supabase = createClient()

  const { data, error } = await supabase
    .from("entries")
    .insert({
      username: player.username,
      website_url: player.url ?? null,
      bid: player.amount,
    })
    .select("username, website_url, bid")
    .single()

  if (error) {
    throw error
  }

  return {
    username: String(data.username),
    amount: Number(data.bid),
    url: data.website_url
      ? String(data.website_url)
      : undefined,
  }
}