import type { APIRoute } from "astro";
import { z } from "zod";
import { getGenerationById } from "../../../lib/services/generations.service";

// Prerender should be false for API routes
export const prerender = false;

// Parameter validation schema
const paramsSchema = z.object({
  generation_id: z.string().regex(/^\d+$/, "Generation ID must be a number"),
});

export const GET: APIRoute = async ({ params, locals }) => {
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

    // Validate generation_id parameter
    const validationResult = paramsSchema.safeParse(params);

    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          message: "Invalid generation ID",
          errors: validationResult.error.errors,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const generationId = parseInt(validationResult.data.generation_id, 10);

    // Use authenticated user's ID
    const user_id = locals.user.id;

    // Fetch the generation
    const generation = await getGenerationById(supabase, generationId, user_id);

    if (!generation) {
      return new Response(JSON.stringify({ message: "Generation not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Return the generation data
    return new Response(JSON.stringify(generation), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching generation:", error);
    return new Response(JSON.stringify({ message: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
