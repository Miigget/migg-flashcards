import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client"; // Adjusted path based on project structure

export const prerender = false; // Ensure server-side rendering for API route

export const POST: APIRoute = async ({ request, cookies }) => {
  const { email, password } = await request.json();

  // Validate input
  if (!email || !password) {
    return new Response(JSON.stringify({ error: "Email and password are required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Supabase login error:", error.message); // Log server-side errors
    return new Response(JSON.stringify({ error: error.message || "Invalid login credentials" }), {
      status: 400, // Use 400 or 401 depending on desired behavior for invalid credentials
      headers: { "Content-Type": "application/json" },
    });
  }

  // Login successful
  return new Response(JSON.stringify({ user: data.user }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
};
