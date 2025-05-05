import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client";
import { z } from "zod";
import { AuthApiError } from "@supabase/supabase-js";

export const prerender = false; // Ensure SSR for API routes

// Define Zod schema for input validation
const registerInputSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  let validatedData;
  try {
    const body = await request.json();
    validatedData = registerInputSchema.parse(body);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ error: "Invalid input.", details: error.errors }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }
    return new Response(JSON.stringify({ error: "Invalid request body." }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const { email, password } = validatedData;

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      // Options can be added here if needed, e.g., redirect URL for email verification
      // options: {
      //   emailRedirectTo: "http://localhost:4321/auth/verify-email" // Or use import.meta.env.SITE_URL
      // }
    });

    if (error) {
      // Handle specific Supabase errors
      if (error instanceof AuthApiError && error.message.includes("User already registered")) {
        return new Response(JSON.stringify({ error: "Email address is already in use." }), {
          status: 409, // Conflict
          headers: { "Content-Type": "application/json" },
        });
      }
      // Log the unexpected error for debugging
      // eslint-disable-next-line no-console
      console.error("Supabase signUp error:", error);
      return new Response(JSON.stringify({ error: error.message || "Registration failed." }), {
        status: error instanceof AuthApiError ? error.status : 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if email confirmation is required
    const needsEmailConfirmation = data.user?.identities?.length === 0; // Or check config

    return new Response(
      JSON.stringify({
        message: needsEmailConfirmation
          ? "Registration successful. Please check your email to verify your account."
          : "Registration successful.",
        user: data.user, // Be cautious about sending full user object
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error during registration:", err);
    return new Response(JSON.stringify({ error: "An unexpected server error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
