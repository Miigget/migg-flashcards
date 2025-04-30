import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";

export const prerender = false; // Ensure server-side rendering

export const POST: APIRoute = async ({ cookies, request, redirect }) => {
  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error("Supabase logout error:", error.message);
    // Return an error response, or redirect to login with an error indicator?
    // For simplicity, redirecting is often fine, but returning JSON might be better for JS clients.
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, // Internal Server Error or 400 depending on expected errors
      headers: { "Content-Type": "application/json" },
    });
    // Alternatively, redirect:
    // return redirect('/auth/login?error=logout_failed');
  }

  // Redirect to the login page after successful logout
  // Use 303 See Other for redirect after POST
  return redirect("/auth/login", 303);
};
