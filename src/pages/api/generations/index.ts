import type { APIRoute } from "astro";
import { z } from "zod";
import { getGenerationsForUser } from "../../../lib/services/generations.service";

// Disable prerendering for this API route
export const prerender = false;

// Query parameters validation schema
const querySchema = z.object({
  page: z.coerce.number().positive().optional().default(1),
  limit: z.coerce.number().positive().max(100).optional().default(10),
});

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Use Supabase from locals
    const supabase = locals.supabase;

    // Check if user is authenticated
    if (!locals.user) {
      return new Response(JSON.stringify({ message: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Query parameter validation
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());

    const validationResult = querySchema.safeParse(queryParams);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid query parameters",
          errors: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { page, limit } = validationResult.data;

    // Get generations using authenticated user's ID
    const generationsResult = await getGenerationsForUser(supabase, locals.user.id, page, limit);

    // Return formatted response
    return new Response(JSON.stringify(generationsResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching generations:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
