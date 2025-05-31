import type { AstroCookies } from "astro";
import { createServerClient, type CookieOptionsWithName, type CookieOptions } from "@supabase/ssr";
import type { Database } from "../db/database.types.ts"; // Assuming database.types.ts is in the same directory

export const cookieOptions: CookieOptionsWithName = {
  name: "sb-miggflashcards-auth-token", // Recommended to give a unique name
  path: "/",
  secure: import.meta.env.PROD, // Use secure cookies in production
  httpOnly: true,
  sameSite: "lax",
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

// Helper function to parse cookies from the request header
function parseCookieHeader(cookieHeader: string | null): { name: string; value: string }[] {
  if (!cookieHeader) {
    return [];
  }
  return cookieHeader.split(";").map((cookie) => {
    const [name, ...rest] = cookie.trim().split("=");
    return { name, value: rest.join("=") };
  });
}

export const createSupabaseServerInstance = (context: { headers: Headers; cookies: AstroCookies }) => {
  const supabase = createServerClient<Database>(import.meta.env.SUPABASE_URL, import.meta.env.SUPABASE_KEY, {
    cookieOptions,
    cookies: {
      getAll() {
        // Get cookies from the request header
        return parseCookieHeader(context.headers.get("Cookie"));
      },
      setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
        // Set cookies using Astro's API
        cookiesToSet.forEach(({ name, value, options }) => context.cookies.set(name, value, options));
      },
    },
  });

  return supabase;
};

// Keep the type export if needed elsewhere, though the client instance itself is created per-request now
// export type SupabaseClientType = ReturnType<typeof createSupabaseServerInstance>;

// Remove old client creation logic
// const supabaseUrl = import.meta.env.SUPABASE_URL;
// const supabaseAnonKey = import.meta.env.SUPABASE_KEY;
// export const supabaseClient = createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
// export const createClient = () => {
//   return createSupabaseClient<Database>(supabaseUrl, supabaseAnonKey);
// };
