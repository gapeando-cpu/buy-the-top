"use client"

import { useEffect, useRef, useState } from "react"
import { Crown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney, type Player } from "@/lib/leaderboard-data"

type BidDialogProps = {
  open: boolean
  currentTop: number
  onClose: () => void
  onSubmit: (player: Player) => Promise<Player>
}

export function BidDialog({
  open,
  currentTop,
  onClose,
  onSubmit,
}: BidDialogProps) {
  const minBid = currentTop + 1

  const [username, setUsername] = useState("")
  const [url, setUrl] = useState("")
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)
  const [submitted, setSubmitted] = useState<Player | null>(null)

  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setUsername("")
    setUrl("")
    setAmount("")
    setError("")
    setSaving(false)
    setSubmitted(null)

    const id = window.setTimeout(() => {
      usernameRef.current?.focus()
    }, 50)

    return () => window.clearTimeout(id)
  }, [open])

  useEffect(() => {
    if (!open) return

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onClose()
      }
    }

    window.addEventListener("keydown", onKey)

    return () => {
      window.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    const trimmedName = username.trim()
    let trimmedUrl = url.trim()
    const bid = Number(amount)

    if (!trimmedName) {
      setError("Please enter a username.")
      return
    }

    if (!trimmedUrl) {
      setError("Please enter a website URL.")
      return
    }

    if (!/^https?:\/\//i.test(trimmedUrl)) {
      trimmedUrl = `https://${trimmedUrl}`
    }

    try {
      const parsedUrl = new URL(trimmedUrl)

      if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
        setError("Please enter a valid website URL.")
        return
      }
    } catch {
      setError("Please enter a valid website URL.")
      return
    }

    if (!Number.isFinite(bid) || bid < minBid) {
      setError(`Your bid must be at least ${formatMoney(minBid)}.`)
      return
    }

    const player: Player = {
      username: trimmedName,
      amount: Math.floor(bid),
      url: trimmedUrl,
    }

    setError("")
    setSaving(true)

    try {
      const savedPlayer = await onSubmit(player)
      setSubmitted(savedPlayer)
    } catch (err: any) {
      console.error("FULL BID ERROR:", err)

      const message =
        err?.message ||
        err?.details ||
        err?.hint ||
        err?.error_description ||
        (typeof err === "string" ? err : "")

      setError(
        message ||
          "Unable to place your bid. Check the browser console for the full error."
      )
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-background/80 p-4 backdrop-blur-sm sm:items-center"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="bid-title"
        className="relative w-full max-w-md overflow-hidden rounded-3xl border border-border bg-card p-6 shadow-2xl sm:p-8"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </button>

        {submitted ? (
          <div className="flex flex-col items-center gap-5 py-4 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-gold text-gold-foreground shadow-lg shadow-gold/30">
              <Crown className="h-7 w-7" aria-hidden="true" />
            </span>

            <div>
              <h2 className="text-3xl font-bold">You&apos;re #1!</h2>

              <p className="mt-2 text-sm text-muted-foreground">
                {submitted.username} now leads with a bid of
              </p>

              <p className="mt-1 font-mono text-4xl font-bold tabular-nums text-gold">
                {formatMoney(submitted.amount)}
              </p>
            </div>

            <Button
              onClick={onClose}
              className="mt-2 h-12 w-full rounded-full bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
            >
              Done
            </Button>
          </div>
        ) : (
          <>
            <h2 id="bid-title" className="text-2xl font-bold">
              Buy your spot
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Bid at least {formatMoney(minBid)} to take the #1 position.
            </p>

            <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="username"
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Username
                </label>

                <input
                  id="username"
                  ref={usernameRef}
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="yourname"
                  autoComplete="off"
                  className="h-12 rounded-xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="url"
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Website URL
                </label>

                <input
                  id="url"
                  type="text"
                  inputMode="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="example.com"
                  autoComplete="off"
                  className="h-12 rounded-xl border border-input bg-background px-4 text-base outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30"
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="amount"
                  className="text-xs font-semibold uppercase tracking-widest text-muted-foreground"
                >
                  Bid amount (USD)
                </label>

                <div className="relative">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 font-mono text-base text-muted-foreground">
                    $
                  </span>

                  <input
                    id="amount"
                    type="number"
                    inputMode="numeric"
                    min={minBid}
                    step={1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder={String(minBid)}
                    className="h-12 w-full rounded-xl border border-input bg-background pl-8 pr-4 font-mono text-base tabular-nums outline-none transition-colors focus:border-gold focus:ring-2 focus:ring-gold/30"
                  />
                </div>
              </div>

              {error ? (
                <div
                  role="alert"
                  className="break-words rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive"
                >
                  {error}
                </div>
              ) : null}

              <Button
                type="submit"
                disabled={saving}
                className="mt-2 h-12 w-full rounded-full bg-gold text-base font-semibold text-gold-foreground hover:bg-gold/90"
              >
                {saving ? "Placing bid…" : "Place bid"}
              </Button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}