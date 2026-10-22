'use server'

import { headers } from 'next/headers'
import { createClient } from '@/utils/supabase/server'
import { parseForm } from '@/lib/validation/form'
import { passwordResetRequestSchema } from '@/lib/validation/admin'
import type { ActionResult } from '@/lib/action-result'

// The site's own origin for the link in the email. Supabase only accepts redirect
// URLs on its allow-list (Auth > URL Configuration), so a spoofed Host can't redirect.
async function siteOrigin() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '')
  const h = await headers()
  const host = h.get('x-forwarded-host') ?? h.get('host') ?? 'localhost:3000'
  const proto = h.get('x-forwarded-proto') ?? (host.startsWith('localhost') ? 'http' : 'https')
  return `${proto}://${host}`
}

// Public form action. Always answers the same way, so it never reveals which
// emails have an account.
export async function requestPasswordReset(_prevState: ActionResult | null, formData: FormData): Promise<ActionResult> {
  const parsed = parseForm(passwordResetRequestSchema, formData)
  if (!parsed.success) {
    return { success: false, message: parsed.message }
  }

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${await siteOrigin()}/auth/confirm?next=/reset-password`,
  })

  // Rate limits and unknown emails are logged, not shown, for the same reason
  if (error) {
    console.error('Password reset request failed:', error.message)
  }

  return {
    success: true,
    message: 'If an account exists for that email, we sent a link to reset the password. It expires in one hour.',
  }
}
