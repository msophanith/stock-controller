// // lib/supabase.ts
// import { createClient } from '@supabase/supabase-js'

// const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
// const supabaseAnonKey =
//   process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!;

// export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
//   realtime: {
//     params: { eventsPerSecond: 10 },
//   },
// })

// // ─── lib/sync.ts ──────────────────────────────────────────────────────────────
// // Offline sync engine: drains the local queue → Supabase when online
// // lib/sync.ts is imported separately below