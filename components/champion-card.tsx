import { Crown } from 'lucide-react'
import { formatMoney, type Player } from '@/lib/leaderboard-data'

export function ChampionCard({ champion }: { champion: Player }) {
  return (
    <section
      aria-label="Current number one"
      className="relative overflow-hidden rounded-3xl border border-gold/40 bg-card"
    >
      {/* gold glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-gold/20 blur-3xl"
      />

      <div className="relative flex flex-col items-center gap-5 p-8 text-center sm:p-10">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg shadow-gold/30">
          <Crown className="h-6 w-6" aria-hidden="true" />
        </span>

        <span className="text-xs font-semibold uppercase tracking-[0.25em] text-gold">
          Current #1
        </span>

        <h2 className="flex items-baseline gap-3 text-4xl font-bold leading-none sm:text-5xl">
          <span className="font-mono text-gold">#1</span>
          {champion.username}
        </h2>

        <div className="pt-2">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Current bid
          </p>
          <p className="mt-1 font-mono text-5xl font-bold tabular-nums text-gold sm:text-6xl">
            {formatMoney(champion.amount)}
          </p>
        </div>
      </div>
    </section>
  )
}
