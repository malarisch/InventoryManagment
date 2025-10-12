"use client";

import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

let supabaseInstance: SupabaseClient | null = null;

export function createSupabaseClient() {
  // Don't create client during build if environment variables are not set
  if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'your_supabase_url_here' || supabaseAnonKey === 'your_supabase_anon_key_here') {
    return null;
  }
  
  // Return existing instance if already created (singleton pattern)
  if (supabaseInstance) {
    return supabaseInstance;
  }
  
  // Create new instance only if it doesn't exist
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
  return supabaseInstance;
}