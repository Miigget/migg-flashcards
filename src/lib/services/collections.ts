import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/db/database.types";

// Use the specific SupabaseClient type generated for your database
type SupabaseClientType = SupabaseClient<Database>;

/**
 * Retrieves unique collection names for the specified user
 * @param supabase The Supabase client instance
 * @param userId The user ID to get collections for
 * @returns Array of unique collection names
 */
async function _getUniqueCollections(supabase: SupabaseClientType, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("collection")
    .eq("user_id", userId)
    .order("collection");

  if (error) {
    console.error("Error retrieving collections:", error);
    throw error; // Re-throw the original Supabase error
  }

  // Extract unique collection names using Set to get only unique values
  // Filter out potential null/undefined if the column allows it (though likely doesn't)
  const collections = data
    .map((item) => item.collection)
    .filter((collection): collection is string => typeof collection === "string");
  const uniqueCollections = [...new Set(collections)];
  return uniqueCollections;
}

/**
 * Checks if a collection exists for a user
 * @param supabase The Supabase client instance
 * @param userId The user ID to check collection for
 * @param collectionName The name of the collection to check
 * @returns Boolean indicating if the collection exists
 */
async function _checkCollectionExists(
  supabase: SupabaseClientType,
  userId: string,
  collectionName: string
): Promise<boolean> {
  const { data, error } = await supabase
    .from("flashcards")
    .select("flashcard_id", { head: true }) // More efficient check, only need existence
    .eq("user_id", userId)
    .eq("collection", collectionName)
    .limit(1); // Only need one record to confirm existence

  if (error) {
    console.error("Error checking collection existence:", error);
    throw error;
  }

  // If data is not null and has length > 0, the collection exists
  return !!data && data.length > 0;
}

/**
 * Gets the count of flashcards in a collection
 * @param supabase The Supabase client instance
 * @param userId The user ID
 * @param collectionName The name of the collection
 * @returns The number of flashcards in the collection
 */
async function _getFlashcardsInCollectionCount(
  supabase: SupabaseClientType,
  userId: string,
  collectionName: string
): Promise<number> {
  const { error, count } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true }) // Count all matching rows efficiently
    .eq("user_id", userId)
    .eq("collection", collectionName);

  if (error) {
    console.error("Error counting flashcards in collection:", error);
    throw error;
  }

  return count ?? 0; // Return count, default to 0 if null
}

/**
 * Renames a collection by updating all flashcards with the specified collection name for a user.
 * Checks if the target name already exists.
 * @param supabase The Supabase client instance
 * @param userId The user ID to update collections for
 * @param currentName The current name of the collection to rename
 * @param newName The new name for the collection
 * @returns Object containing the count of updated flashcards and a flag indicating if the original collection existed.
 * @throws Error if the new collection name already exists for the user.
 */
async function _renameCollection(
  supabase: SupabaseClientType,
  userId: string,
  currentName: string,
  newName: string
): Promise<{ count: number; collectionExists: boolean }> {
  if (currentName === newName) {
    // Use internal service call via the exported 'service' object
    const exists = await service.checkCollectionExists(supabase, userId, currentName);
    if (!exists) {
      return { count: 0, collectionExists: false };
    }
    // Use internal service call via the exported 'service' object
    const count = await service.getFlashcardsInCollectionCount(supabase, userId, currentName);
    return { count: count, collectionExists: true };
  }

  // Use internal service call via the exported 'service' object
  const collectionExists = await service.checkCollectionExists(supabase, userId, currentName);
  if (!collectionExists) {
    console.log(`Collection "${currentName}" does not exist for user ${userId} to rename.`);
    return { count: 0, collectionExists: false };
  }

  // Use internal service call via the exported 'service' object
  const newNameExists = await service.checkCollectionExists(supabase, userId, newName);
  if (newNameExists) {
    throw new Error(`Cannot rename: A collection named "${newName}" already exists for this user.`);
  }

  // 3. Perform the update
  const { error, count } = await supabase
    .from("flashcards")
    .update({ collection: newName })
    .eq("user_id", userId)
    .eq("collection", currentName)
    .select("*", { count: "exact", head: true }); // Count updated rows

  if (error) {
    console.error("Error renaming collection (update operation):", error);
    throw error;
  }

  console.log(
    `Renamed collection "${currentName}" to "${newName}" for user ${userId}. Updated ${count ?? 0} flashcards.`
  );
  return { count: count ?? 0, collectionExists: true };
}

/**
 * Deletes a collection by removing all flashcards with the specified collection name for a user.
 * @param supabase The Supabase client instance
 * @param userId The user ID to delete collections for
 * @param collectionName The name of the collection to delete
 * @returns Object containing the count of deleted flashcards and a flag indicating if the collection existed before deletion.
 */
async function _deleteCollection(
  supabase: SupabaseClientType,
  userId: string,
  collectionName: string
): Promise<{ count: number; collectionExists: boolean }> {
  // Use internal service call via the exported 'service' object
  const collectionExists = await service.checkCollectionExists(supabase, userId, collectionName);
  if (!collectionExists) {
    console.log(`Collection "${collectionName}" does not exist for user ${userId} to delete.`);
    return { count: 0, collectionExists: false };
  }

  // Use internal service call via the exported 'service' object
  const countBeforeDelete = await service.getFlashcardsInCollectionCount(supabase, userId, collectionName);

  // 2. Perform the deletion - only get error, ignore count from delete result
  const { error } = await supabase
    .from("flashcards")
    .delete()
    .eq("user_id", userId)
    .eq("collection", collectionName)
    .select("*", { count: "exact", head: true }); // Count deleted rows

  if (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }

  // Although 'count' from delete might be useful, returning the count *before* deletion seems more informative.
  console.log(`Deleted collection "${collectionName}" for user ${userId}. Removed ${countBeforeDelete} flashcards.`);
  return { count: countBeforeDelete, collectionExists: true };
}

// Export the service object containing all functions
export const service = {
  getUniqueCollections: _getUniqueCollections,
  checkCollectionExists: _checkCollectionExists,
  getFlashcardsInCollectionCount: _getFlashcardsInCollectionCount,
  renameCollection: _renameCollection,
  deleteCollection: _deleteCollection,
};
