import type { APIRoute } from "astro";
import { z } from "zod";
import type { GenerationErrorLogDTO, PaginatedResponse } from "../../types";
import { getGenerationErrorLogs } from "../../lib/services/generationErrors.service";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

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

    // Use DEFAULT_USER_ID instead of authentication
    const userId = DEFAULT_USER_ID;

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
    console.error("Error fetching generation error logs:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
