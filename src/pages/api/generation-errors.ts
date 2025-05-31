import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerationErrorLogDTO, PaginatedResponse } from "../../types";
import { getGenerationErrorLogs } from "../../lib/services/generationErrors.service";

export const prerender = false;

// Query schema validation
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

    // Use authenticated user's ID
    const userId = locals.user.id;

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

    // Fetch error logs from database via service
    const response: PaginatedResponse<GenerationErrorLogDTO> = await getGenerationErrorLogs(
      supabase,
      userId,
      page,
      limit
    );

    // Return formatted response
    return new Response(JSON.stringify(response), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching generation error logs:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
