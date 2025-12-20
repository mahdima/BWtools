import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string

if (!supabaseUrl || !supabaseServiceRoleKey) {
    // We log a warning but don't throw immediately to avoid breaking build if env matches are missing locally
    // but the throw in the function calls will handle it.
    console.warn('Missing Supabase Service Role environment variables.')
}

// this client bypasses RLS
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey)
