import type { APIRoute } from "astro";
import { z } from "zod";
import type { UpdateCollectionCommand } from "../../../types";
import { service as collectionService } from "../../../lib/services/collections";

export const prerender = false;

// Schema validation for the request body
const updateCollectionSchema = z.object({
  new_name: z.string().min(1).max(30),
});

// Schema validation for collection name parameter
const collectionNameSchema = z.string().min(1).max(30);

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

    // 3. Get supabase instance and user from locals
    const supabase = locals.supabase;
    const user = locals.user;

    // --- Authentication Check ---
    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "User must be logged in to rename collections." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const userId = user.id;
    // ---------------------------

    try {
      // Use the authenticated user ID
      const { count, collectionExists } = await collectionService.renameCollection(
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
    // eslint-disable-next-line no-console
    console.error("Error updating collection:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ params, locals }) => {
  try {
    // 1. Extract collection_name from URL parameters
    const { collection_name } = params;

    if (!collection_name) {
      return new Response(JSON.stringify({ error: "Collection name is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 2. Validate collection_name parameter
    const validationResult = collectionNameSchema.safeParse(collection_name);
    if (!validationResult.success) {
      return new Response(
        JSON.stringify({
          error: "Invalid collection name",
          details: validationResult.error.format(),
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // 3. Get supabase instance and user from locals
    const supabase = locals.supabase;
    const user = locals.user;

    // --- Authentication Check ---
    if (!user || !user.id) {
      return new Response(
        JSON.stringify({ error: "Unauthorized", message: "User must be logged in to delete collections." }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" },
        }
      );
    }
    const userId = user.id;
    // ---------------------------

    // 4. Delete the collection using the service function
    const { count, collectionExists } = await collectionService.deleteCollection(supabase, userId, collection_name);

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

    // 5. Return success response with count of deleted items
    return new Response(
      JSON.stringify({
        message: `Collection '${collection_name}' deleted successfully.`,
        deletedCount: count,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Error deleting collection:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
