import { formatMoney, type Player } from '@/lib/leaderboard-data'

function Row({ rank, player }: { rank: number; player: Player }) {
  return (
    <li className="flex items-center gap-4 px-4 py-3.5 transition-colors hover:bg-accent sm:px-5">
      <span className="w-6 shrink-0 text-center font-mono text-base font-semibold text-muted-foreground tabular-nums">
        {rank}
      </span>

      <span className="min-w-0 flex-1 truncate font-medium">{player.username}</span>

      <span className="shrink-0 font-mono text-base font-semibold tabular-nums text-foreground">
        {formatMoney(player.amount)}
      </span>
    </li>
  )
}

export function LeaderboardList({ contenders }: { contenders: Player[] }) {
  return (
    <section aria-label="Leaderboard positions below number one">
      <div className="flex items-center justify-between px-4 pb-3 sm:px-5">
        <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Rank
        </h3>
        <span className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
          Bid
        </span>
      </div>
      <ol className="divide-y divide-border overflow-hidden rounded-3xl border border-border bg-card">
        {contenders.map((player, i) => (
          <Row key={player.username + i} rank={i + 2} player={player} />
        ))}
      </ol>
    </section>
  )
}
