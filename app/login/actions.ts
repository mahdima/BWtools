'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function login(prevState: any, formData: FormData) {
  console.log("Login action started");
  console.log("URL present:", !!process.env.NEXT_PUBLIC_SUPABASE_URL);
  console.log("Key present:", !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

  try {
      const supabase = await createClient()
      
      const email = formData.get('email') as string
      const password = formData.get('password') as string

      console.log("Attempting sign in for:", email);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        console.error("Sign in error:", error.message);
        return { error: error.message }
      }
      
      console.log("Sign in successful");
  } catch (err) {
      console.error("Unexpected error in login action:", err);
      return { error: "An unexpected error occurred" };
  }

  revalidatePath('/', 'layout')
  redirect('/')
}
