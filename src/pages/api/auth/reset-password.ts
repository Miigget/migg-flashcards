import type { APIRoute } from "astro";
import { createSupabaseServerInstance } from "@/db/supabase.client.ts";
import { z } from "zod";

export const prerender = false;

const ResetPasswordSchema = z.object({
  // The token is handled via the session cookie after the user clicks the email link,
  // so we only need the new password here.
  password: z.string().min(6, { message: "Password must be at least 6 characters long" }),
});

export const POST: APIRoute = async ({ request, cookies }) => {
  let validatedData;
  try {
    const rawData = await request.json();
    validatedData = ResetPasswordSchema.parse(rawData);
  } catch (error) {
    console.error("Zod validation error:", error);
    return new Response(JSON.stringify({ error: "Invalid password format or missing password." }), { status: 400 });
  }

  const supabase = createSupabaseServerInstance({ cookies, headers: request.headers });

  // The user's session is already established by clicking the link in the email.
  // We can now update the password for the authenticated user.
  const { error } = await supabase.auth.updateUser({ password: validatedData.password });

  if (error) {
    console.error("Supabase reset password error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to update password." }),
      { status: 400 } // Use 400 or potentially 500 depending on the error type
    );
  }

  // Password updated successfully
  return new Response(JSON.stringify({ message: "Password updated successfully." }), { status: 200 });
};
