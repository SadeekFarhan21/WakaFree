import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// One-time setup endpoint to create the first user and get an API key.
// Returns 400 if a user already exists.
export async function POST(request: NextRequest) {
  const { count } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Setup already completed. A user already exists.' },
      { status: 400 }
    )
  }

  const body = await request.json()
  const { email, username, display_name } = body

  if (!email) {
    return NextResponse.json({ error: 'email is required' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('users')
    .insert({ email, username: username ?? email.split('@')[0], display_name })
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({
    message: 'User created. Save your API key — it will not be shown again.',
    api_key: data.api_key,
    user: { id: data.id, email: data.email, username: data.username },
  })
}
