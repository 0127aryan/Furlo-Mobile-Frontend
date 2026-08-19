import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { getSupabaseConfig } from '@/api/auth';

let client: SupabaseClient | null = null;

export async function getSupabase(): Promise<SupabaseClient | null> {
  if (client) return client;

  try {
    const config = await getSupabaseConfig();
    if (!config.supabaseUrl || !config.supabaseAnonKey) {
      return null;
    }
    client = createClient(config.supabaseUrl, config.supabaseAnonKey);
    return client;
  } catch {
    return null;
  }
}
