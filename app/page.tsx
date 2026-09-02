"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import { ArrowUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ChampionCard } from "@/components/champion-card"
import { LeaderboardList } from "@/components/leaderboard-list"
import { BidDialog } from "@/components/bid-dialog"
import {
  fetchPlayers,
  sortPlayers,
  formatMoney,
  type Player,
} from "@/lib/leaderboard-data"

export default function Page() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)

  const loadLeaderboard = useCallback(async () => {
    setLoading(true)
    setLoadError("")

    try {
      const rows = await fetchPlayers()
      setPlayers(rows)
    } catch (err) {
      console.error("[v0] failed to load leaderboard", err)

      setLoadError(
        "Unable to load the leaderboard. Please try again."
      )
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadLeaderboard()
  }, [loadLeaderboard])

  useEffect(() => {
    if (!window.location.search.includes("checkout=")) return

    window.history.replaceState({}, "", window.location.pathname)
    void loadLeaderboard()
  }, [loadLeaderboard])

  const sorted = useMemo(() => sortPlayers(players), [players])
  const champion = sorted[0]
  const contenders = sorted.slice(1)

  async function handleSubmit(player: Player): Promise<void> {
    const response = await fetch("/api/create-checkout-session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: player.username,
        url: player.url,
        bid: player.amount,
      }),
    })
    const result = await response.json()

    if (!response.ok || !result.url) {
      throw new Error(result.error || "Unable to open secure checkout. Please try again.")
    }

    setDialogOpen(false)
    window.location.assign(result.url)
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* ambient gold light behind the title */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-gold/15 blur-3xl"
      />

      <div className="relative mx-auto flex max-w-md flex-col gap-9 px-5 py-14 sm:py-20">
        {/* Hero */}
        <header className="flex flex-col items-center text-center">
          <h1 className="text-balance text-5xl font-bold leading-[0.95] tracking-tight sm:text-6xl">
            BUY THE <span className="text-gold">TOP</span>
          </h1>

          <p className="mt-4 text-lg font-medium text-foreground">
            Pay more. Climb higher.
          </p>

          <p className="mt-2 text-balance text-sm text-muted-foreground">
            One leaderboard. Outbid the person above you and take their spot.
          </p>

          <Button
            size="lg"
            onClick={() => setDialogOpen(true)}
            disabled={loading || !!loadError}
            className="mt-8 h-14 w-full gap-2 rounded-full bg-gold px-8 text-base font-semibold text-gold-foreground shadow-lg shadow-gold/20 hover:bg-gold/90 disabled:opacity-60 sm:w-auto"
          >
            <ArrowUp className="h-5 w-5" aria-hidden="true" />
            BUY YOUR SPOT
          </Button>

          {champion ? (
            <p className="mt-3 text-xs text-muted-foreground">
              Outbid {formatMoney(champion.amount)} to become #1.
            </p>
          ) : null}
        </header>

        {loading ? (
          <p
            className="py-10 text-center text-sm text-muted-foreground"
            role="status"
          >
            Loading the leaderboard…
          </p>
        ) : loadError ? (
          <section
            className="flex flex-col items-center gap-4 py-10 text-center"
            aria-live="polite"
          >
            <p className="text-sm text-muted-foreground">
              {loadError}
            </p>

            <Button
              type="button"
              variant="outline"
              onClick={() => void loadLeaderboard()}
              className="rounded-full"
            >
              Retry
            </Button>
          </section>
        ) : champion ? (
          <>
            <ChampionCard champion={champion} />
            <LeaderboardList contenders={contenders} />
          </>
        ) : (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No bids yet. Be the first to buy the top.
          </p>
        )}

        <footer className="pt-1 text-center text-xs text-muted-foreground">
          Visual prototype · Live leaderboard. No real money changes hands.
        </footer>
      </div>

      <BidDialog
        open={dialogOpen}
        currentTop={champion?.amount ?? 0}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleSubmit}
      />
    </main>
  )
}