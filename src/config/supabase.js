import { createClient } from '@supabase/supabase-js'

// Supabase yapılandırması
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://fcuumqrwhwtuvcjitseu.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_X1nfFfq2h0rDIHpmmN7SyQ_TyWsMQ4_'

// Kimlik doğrulama olmadan erişim için
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Oturum bilgilerini saklamayı devre dışı bırak
    autoRefreshToken: false, // Token yenilemesini devre dışı bırak
  }
}) 