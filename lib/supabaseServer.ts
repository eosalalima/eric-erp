// lib/supabaseServer.ts
import { cookies } from 'next/headers'
import { createServerClient } from '@supabase/ssr'

export const supabaseServer = async () => {
    const cookieStore = await cookies()
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,   // anon is fine for RLS-aware server work
        {
            cookies: {
                get(name: string) { return cookieStore.get(name)?.value },
                set() { }, // Next manages cookies in responses; leave empty in RSC
                remove() { },
            },
        }
    )
}
