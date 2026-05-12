import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { createClient } from '@supabase/supabase-js'

export default async function Home() {
  // Simple redirect: unauthenticated users go to login, authenticated go to dashboard
  // AuthGuard on /dashboard handles the actual session check
  redirect('/login')
}
