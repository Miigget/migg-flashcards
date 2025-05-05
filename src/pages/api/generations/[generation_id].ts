import { z } from "zod";
import type { APIRoute } from "astro";
import { getGenerationById } from "../../../lib/services/generations.service";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";

// Prerender should be false for API routes
export const prerender = false;

// Schema for validating the generation_id parameter
const paramsSchema = z.object({
  generation_id: z.coerce
    .number({
      invalid_type_error: "generation_id must be a number",
    })
    .positive("generation_id must be a positive number"),
});

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Validate generation_id parameter
    const validationResult = paramsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid request parameters",
          details: validationResult.error.format(),
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const { generation_id } = validationResult.data;

    // 2. Use Supabase client from locals
    const supabase = locals.supabase;

    // Using DEFAULT_USER_ID instead of authentication
    const user_id = DEFAULT_USER_ID;

    // 3. Get generation using the service
    const { generation, error } = await getGenerationById(supabase, generation_id, user_id);

    if (error) {
      return new Response(
        JSON.stringify({
          error: "Failed to retrieve generation",
          details: error.message,
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    if (!generation) {
      return new Response(JSON.stringify({ error: "Generation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 4. Return the generation data
    return new Response(JSON.stringify(generation), { status: 200, headers: { "Content-Type": "application/json" } });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Unexpected error in GET /api/generations/[generation_id]:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
