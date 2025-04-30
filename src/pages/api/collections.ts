import type { APIRoute } from "astro";
import { getUniqueCollections } from "../../lib/services/collections";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Get supabase instance from context.locals
    const supabase = locals.supabase;

    // Check if supabase client exists (middleware should provide it)
    if (!supabase) {
      console.error("Supabase client not found in locals. Check middleware.");
      return new Response(JSON.stringify({ error: "Server configuration error" }), { status: 500 });
    }

    // Get the authenticated user
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    // Get unique collections for the logged-in user
    const collections = await getUniqueCollections(supabase, user.id);

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
