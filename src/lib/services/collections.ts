import type { SupabaseClientType } from "../../db/supabase.client";

/**
 * Retrieves unique collection names for the specified user
 * @param supabase The Supabase client instance
 * @param userId The user ID to get collections for
 * @returns Array of unique collection names
 */
export async function getUniqueCollections(supabase: SupabaseClientType, userId: string): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("flashcards")
      .select("collection")
      .eq("user_id", userId)
      .order("collection");

    if (error) {
      throw error;
    }

    // Extract unique collection names using Set to get only unique values
    const collections = data.map((item) => item.collection as string);
    const uniqueCollections = [...new Set(collections)];
    return uniqueCollections;
  } catch (error) {
    console.error("Error retrieving collections:", error);
    throw error;
  }
}
