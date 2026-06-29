import { NextRequest, NextResponse } from 'next/server'

// Guards the sync/export endpoints with a shared secret (SYNC_SECRET, falling
// back to CRON_SECRET which Vercel cron sends automatically as a Bearer token).
//
// Accepts the secret via either:
//   Authorization: Bearer <secret>      (used by Vercel cron)
//   ?secret=<secret>                     (convenient for manual/browser access)
//
// Returns a NextResponse to short-circuit when unauthorized, or null when OK.
export function checkSecret(req: NextRequest): NextResponse | null {
  const secret = process.env.SYNC_SECRET ?? process.env.CRON_SECRET

  // Fail closed: if no secret is configured, the endpoint is locked entirely.
  if (!secret) {
    return NextResponse.json(
      { error: 'Endpoint locked: set SYNC_SECRET (or CRON_SECRET) to enable access.' },
      { status: 503 }
    )
  }

  const header = req.headers.get('authorization') ?? ''
  const querySecret = new URL(req.url).searchParams.get('secret')

  if (header === `Bearer ${secret}` || querySecret === secret) {
    return null
  }

  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}
