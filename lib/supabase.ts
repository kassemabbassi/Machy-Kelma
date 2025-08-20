import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase URL or Anon Key environment variables.")
}

// Client-side Supabase client (for public data and client-side actions)
export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Server-side Supabase client (for Server Actions and secure operations)
// Note: In a real app, you'd typically use a service role key or RLS with user sessions
// For this simple username-based login, we'll use the anon key for simplicity,
// but ensure RLS policies are in place for security.
export const createServerSupabaseClient = () => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: false, // No session persistence on server
    },
  })
}
