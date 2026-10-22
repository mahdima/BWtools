'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { findActiveAdmin } from '@/lib/auth'

export async function login(prevState: any, formData: FormData) {
  try {
      const supabase = await createClient()

      const email = formData.get('email') as string
      const password = formData.get('password') as string

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        return { error: error.message }
      }

      // A valid Supabase account is not enough: only active admins may use the dashboard.
      const admin = await findActiveAdmin(data.user.id)
      if (!admin) {
        await supabase.auth.signOut()
        return { error: 'This account does not have dashboard access.' }
      }
  } catch (err) {
      console.error("Unexpected error in login action:", err);
      return { error: "An unexpected error occurred" };
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
