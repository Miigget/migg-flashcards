import type { APIRoute } from "astro";
import { getUniqueCollections } from "../../lib/services/collections";
import { DEFAULT_USER_ID } from "../../db/supabase.client";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get supabase instance from context.locals
    const supabase = locals.supabase;

    // Use the default user ID instead of authentication
    const userId = DEFAULT_USER_ID;

    // Get unique collections for the user
    const collections = await getUniqueCollections(supabase, userId);

    // Return the collections as a JSON array
    return new Response(JSON.stringify(collections), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
      },
    });
  } catch (error) {
    console.error("Error fetching collections:", error);

    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
      },
    });
  }
};
