import { z } from "zod";
import type { APIRoute } from "astro";
import { getGenerationsForUser } from "../../../lib/services/generations.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Disable prerendering for this API route
export const prerender = false;

// Query parameters validation schema
const QueryParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().min(1).max(100).default(20),
});

// Define the type based on the schema
interface QueryParams {
  page?: string;
  limit?: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    // Get supabase client from locals
    const supabase = locals.supabase;

    // Parse and validate query parameters
    const url = new URL(request.url);

    // Create an object for query params, only including non-null values
    const queryParams: QueryParams = {};

    // Only add parameters to the object if they exist in the URL
    const pageParam = url.searchParams.get("page");
    const limitParam = url.searchParams.get("limit");

    if (pageParam !== null) {
      queryParams.page = pageParam;
    }

    if (limitParam !== null) {
      queryParams.limit = limitParam;
    }

    // Now parse with default values applying correctly
    const queryResult = QueryParamsSchema.safeParse(queryParams);

    if (!queryResult.success) {
      return new Response(JSON.stringify({ error: "Invalid query parameters", details: queryResult.error.format() }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { page, limit } = queryResult.data;

    // Get generations using DEFAULT_USER_ID instead of authenticated user
    const generationsResult = await getGenerationsForUser(supabase, DEFAULT_USER_ID, page, limit);

    // Return paginated response
    return new Response(JSON.stringify(generationsResult), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching generations:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
