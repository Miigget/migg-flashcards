import type { SupabaseClient } from "@supabase/supabase-js";
import type { GenerationErrorLogDTO, PaginatedResponse } from "../../types";

/**
 * Fetches generation error logs for a specific user with pagination
 */
export async function getGenerationErrorLogs(
  supabase: SupabaseClient,
  userId: string,
  page = 1,
  limit = 10
): Promise<PaginatedResponse<GenerationErrorLogDTO>> {
  // Calculate pagination offset
  const offset = (page - 1) * limit;

  // Query to count total items for pagination
  const { count } = await supabase
    .from("generation_error_logs")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);

  // Query to fetch the data with pagination
  const { data, error } = await supabase
    .from("generation_error_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error("Error fetching generation error logs:", error);
    throw new Error(`Failed to fetch generation error logs: ${error.message}`);
  }

  return {
    data: data || [],
    page,
    limit,
    total: count || 0,
  };
}
