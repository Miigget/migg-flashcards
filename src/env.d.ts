/// <reference types="astro/client" />

// Add necessary imports for Supabase types
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./db/database.types.ts";

// Remove unused imports
// import type { SupabaseClient } from "@supabase/supabase-js";
// import type { Database } from "./db/database.types.ts";

declare global {
  namespace App {
    interface Locals {
      // Uncomment and ensure correct type for supabase client
      supabase: SupabaseClient<Database>;
      // Define the user object structure
      user: {
        id: string;
        email: string;
      } | null; // Allow null for logged-out state
    }
  }
}

interface ImportMetaEnv {
  readonly SUPABASE_URL: string;
  readonly SUPABASE_KEY: string;
  readonly OPENROUTER_API_KEY: string;
  // more env variables...
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
