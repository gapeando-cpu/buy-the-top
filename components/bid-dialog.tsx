"use client"

import { useEffect, useRef, useState } from "react"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { formatMoney, type Player } from "@/lib/leaderboard-data"

type BidDialogProps = {
  open: boolean
  currentTop: number
  onClose: () => void
  onSubmit: (player: Player) => Promise<void>
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

  const usernameRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (!open) return

    setUsername("")
    setUrl("")
    setAmount("")
    setError("")
    setSaving(false)

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

    if (!trimmedName || trimmedName.length > 30 || !/^[A-Za-z0-9_-]+$/.test(trimmedName)) {
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

  const hasValidProtocol =
    parsedUrl.protocol === "http:" || parsedUrl.protocol === "https:"

  const hasValidHostname =
    parsedUrl.hostname.length > 0 &&
    !/\s/.test(parsedUrl.hostname) &&
    parsedUrl.hostname.includes(".")

  if (!hasValidProtocol || !hasValidHostname) {
    setError("Please enter a valid website URL.")
    return
  }
} catch {
  setError("Please enter a valid website URL.")
  return
}

    if (!Number.isFinite(bid) || bid < minBid) {
      setError(`Your payment must be at least ${formatMoney(minBid)}.`)
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
      await onSubmit(player)
    } catch (err: any) {
      console.error("FULL BID ERROR:", err)

      const message =
        err?.message ||
        err?.details ||
        err?.hint ||
        err?.error_description ||
        (typeof err === "string" ? err : "")

      setError(
        message || "Unable to open secure checkout. Please try again."
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

        <>
            <h2 id="bid-title" className="text-2xl font-bold">
              Buy your spot
            </h2>

            <p className="mt-1 text-sm text-muted-foreground">
              Pay at least {formatMoney(minBid)} to take the #1 position.
            </p>

            <p className="mt-2 text-xs text-muted-foreground">
              You are paying for leaderboard placement. There are no prizes or payouts.
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
                  Amount to pay (USD)
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
                {saving ? "Opening secure checkout…" : "Continue to payment"}
              </Button>
            </form>
        </>
      </div>
    </div>
  )
}