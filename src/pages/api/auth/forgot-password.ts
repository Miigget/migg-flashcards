import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { z } from "zod";

export const prerender = false;

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

export const POST: APIRoute = async ({ request, cookies, url }) => {
  let validatedData;
  try {
    const rawData = await request.json();
    validatedData = ForgotPasswordSchema.parse(rawData);
  } catch (error) {
    // Log the validation error
    console.error("Zod validation error:", error);
    return new Response(JSON.stringify({ error: "Invalid email format." }), { status: 400 });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  // Construct the redirect URL for the password reset link
  // This URL should point to your reset password page
  const redirectTo = `${url.origin}/auth/reset-password`;

  const { error } = await supabase.auth.resetPasswordForEmail(validatedData.email, {
    redirectTo,
  });

  if (error) {
    // Log the error for debugging, but don't expose details to the client
    console.error("Supabase forgot password error:", error);
    // Return a generic success message regardless of whether the email exists
    // This prevents user enumeration attacks
    return new Response(
      JSON.stringify({ message: "If an account with this email exists, a password reset link has been sent." }),
      { status: 200 }
    );
  }

  return new Response(
    JSON.stringify({ message: "If an account with this email exists, a password reset link has been sent." }),
    { status: 200 }
  );
};
