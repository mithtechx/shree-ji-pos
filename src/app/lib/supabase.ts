import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error("❌ Critical Error: Supabase Environment Keys are Missing in .env.local!");
}

// Clean up any accidental blank spaces or trailing slashes that break the endpoint URL
const formattedUrl = supabaseUrl?.trim().replace(/\/$/, "");
const formattedKey = supabaseAnonKey?.trim();

export const supabase = createClient(formattedUrl || '', formattedKey || '');