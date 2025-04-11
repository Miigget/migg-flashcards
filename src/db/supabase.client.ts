import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = import.meta.env.SUPABASE_URL;
const supabaseAnonKey = import.meta.env.SUPABASE_KEY;

// Create a reusable Supabase client
export const supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);

// Export the SupabaseClient type
export type SupabaseClientType = typeof supabaseClient;

export const DEFAULT_USER_ID = "09f88a9c-62f5-4c10-9b76-914ee25ee50f";

// Export function to create a new client
export const createClient = () => {
  return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
};
