'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { findActiveAdmin } from '@/lib/auth'
import { getTranslations } from 'next-intl/server'

export async function login(prevState: any, formData: FormData) {
  const t = await getTranslations('actions')
  try {
      const supabase = await createClient()

      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        // Supabase's own wording otherwise (rate limits, unconfirmed email, ...)
        return { error: error.code === 'invalid_credentials' ? t('auth.invalidCredentials') : error.message }
      }

      // A valid Supabase account is not enough: only active admins may use the dashboard.
      const admin = await findActiveAdmin(data.user.id)
      if (!admin) {
        await supabase.auth.signOut()
        return { error: (await getTranslations('auth'))('noAccess') }
      }
  } catch (err) {
      console.error("Unexpected error in login action:", err);
      return { error: t('common.unexpected') };
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
