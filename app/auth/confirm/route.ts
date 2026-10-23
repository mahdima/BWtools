import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest } from 'next/server'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { safeRedirectPath } from '@/lib/redirect'

// Where links in Supabase auth emails land (password reset). Accepts both link styles:
// - ?code=...                  from the default email template (PKCE, same browser)
// - ?token_hash=...&type=...   from a template that links here directly
// On success the user has a session and is sent to `next` (same-site paths only).
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const next = safeRedirectPath(searchParams.get('next'))
  const code = searchParams.get('code')
  const tokenHash = searchParams.get('token_hash')
  const type = searchParams.get('type') as EmailOtpType | null

  const supabase = await createClient()

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) redirect(next)
    console.error('Auth link code exchange failed:', error.message)
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({ type, token_hash: tokenHash })
    if (!error) redirect(next)
    console.error('Auth link verification failed:', error.message)
  }

  redirect('/login?error=reset_link')
}
