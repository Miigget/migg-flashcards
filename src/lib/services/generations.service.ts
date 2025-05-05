import type { PaginatedResponse, GenerationDTO } from "../../types";
import type { SupabaseClientType } from "../../db/supabase.client";

/**
 * Fetches paginated generation sessions for a specific user
 * @param supabase The Supabase client instance
 * @param userId The user ID to fetch generations for
 * @param page The page number (starting from 1)
 * @param limit The number of items per page
 * @returns A paginated response containing generation sessions
 */
export async function getGenerationsForUser(
  supabase: SupabaseClientType,
  userId: string,
  page: number,
  limit: number
): Promise<PaginatedResponse<GenerationDTO>> {
  // Calculate offset for pagination
  const offset = (page - 1) * limit;

  // Fetch total count for pagination
  const { count } = await supabase
    .from("generations")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Fetch generations with pagination
  const { data, error } = await supabase
    .from("generations")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    // eslint-disable-next-line no-console
    console.error("Error fetching generations:", error);
    throw new Error("Failed to fetch generations");
  }

  return {
    data: data || [],
    page,
    limit,
    total: count || 0,
  };
}

/**
 * Retrieves a generation by its ID and user ID for authorization
 *
 * @param supabase Supabase client instance
 * @param generation_id ID of the generation to retrieve
 * @param user_id User ID for authorization check
 * @returns The generation or null if not found
 */
export async function getGenerationById(
  supabase: SupabaseClientType,
  generation_id: number,
  user_id: string
): Promise<{ generation: GenerationDTO | null; error: Error | null }> {
  try {
    const { data, error } = await supabase
      .from("generations")
      .select("*")
      .eq("generation_id", generation_id)
      .eq("user_id", user_id)
      .single();

    if (error) {
      return { generation: null, error: new Error(error.message) };
    }

    return { generation: data, error: null };
  } catch (error) {
    return {
      generation: null,
      error: error instanceof Error ? error : new Error("Unknown error occurred"),
    };
  }
}
