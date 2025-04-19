import type { APIRoute } from "astro";
import { z } from "zod";
import type { UpdateCollectionCommand } from "../../../types";
import { DEFAULT_USER_ID } from "../../../db/supabase.client";
import { renameCollection } from "../../../lib/services/collections";

export const prerender = false;

// Schema validation for the request body
const updateCollectionSchema = z.object({
  new_name: z.string().min(1).max(30),
});

export const PUT: APIRoute = async ({ params, request, locals }) => {
  try {
    // 1. Extract collection_name from URL parameters
    const { collection_name } = params;

    if (!collection_name) {
      return new Response(JSON.stringify({ error: "Collection name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Extract and validate request body
    let requestBody: UpdateCollectionCommand;
    try {
      const rawBody = await request.json();
      const validationResult = updateCollectionSchema.safeParse(rawBody);

      if (!validationResult.success) {
        return new Response(
          JSON.stringify({
            error: "Invalid request body",
            details: validationResult.error.format(),
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      requestBody = validationResult.data;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 3. Get supabase instance from context.locals
    const supabase = locals.supabase;

    // Use the default user ID instead of authentication
    const userId = DEFAULT_USER_ID;

    try {
      // Use the service function to rename the collection
      const { count, collectionExists } = await renameCollection(
        supabase,
        userId,
        collection_name,
        requestBody.new_name
      );

      // Check if the collection exists
      if (!collectionExists) {
        return new Response(
          JSON.stringify({
            error: "Collection not found",
            message: `No flashcards found in collection '${collection_name}'`,
          }),
          {
            status: 404,
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Return appropriate response with the number of updated records
      // Even if count is 0, we still return success if the collection exists
      return new Response(
        JSON.stringify({
          message: "Collection renamed successfully.",
          updated_count: count,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }
      );
    } catch (serviceError) {
      // Handle specific error from the service
      if (serviceError instanceof Error && serviceError.message.includes("already exists")) {
        return new Response(
          JSON.stringify({
            error: "Collection name already exists",
            message: serviceError.message,
          }),
          {
            status: 409, // Conflict
            headers: { "Content-Type": "application/json" },
          }
        );
      }

      // Re-throw to be caught by the outer catch block
      throw serviceError;
    }
  } catch (error) {
    console.error("Error updating collection:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
