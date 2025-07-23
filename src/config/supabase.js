import { createClient } from '@supabase/supabase-js'

// Supabase yapılandırması
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://oxrzvaiodfaugodncrrk.supabase.co'
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im94cnp2YWlvZGZhdWdvZG5jcnJrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMxNjYwMTksImV4cCI6MjA2ODc0MjAxOX0.w-xFWwfY_kKBthccLXAuvaxFYaVoA11kdgszteoioME'

// Kimlik doğrulama olmadan erişim için
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false, // Oturum bilgilerini saklamayı devre dışı bırak
    autoRefreshToken: false, // Token yenilemesini devre dışı bırak
  }
}) 