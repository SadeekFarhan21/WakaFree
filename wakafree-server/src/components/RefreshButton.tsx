'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { refreshRecent } from '@/app/dashboard/actions'

export default function RefreshButton() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const busy = loading || isPending

  async function refresh() {
    setLoading(true)
    setStatus(null)
    try {
      const result = await refreshRecent(2)
      if (result.error) throw new Error(result.error)
      setStatus(`Synced ${result.synced} day${result.synced === 1 ? '' : 's'}`)
      // Re-render the server component with fresh data.
      startTransition(() => router.refresh())
    } catch (err) {
      setStatus(err instanceof Error ? err.message : 'Refresh failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center gap-3">
      {status && <span className="text-xs text-[#7f8ea3]">{status}</span>}
      <button
        onClick={refresh}
        disabled={busy}
        className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-lg border border-[#1d283a] bg-[#0c1117] text-[#e1e7ef] hover:bg-[#1d283a] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <svg
          className={`w-4 h-4 ${busy ? 'animate-spin' : ''}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
          <path d="M21 3v5h-5" />
          <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
          <path d="M3 21v-5h5" />
        </svg>
        {busy ? 'Refreshing…' : 'Refresh data'}
      </button>
    </div>
  )
}
