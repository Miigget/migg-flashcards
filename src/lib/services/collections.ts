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

/**
 * Checks if a collection exists for a user
 * @param supabase The Supabase client instance
 * @param userId The user ID to check collection for
 * @param collectionName The name of the collection to check
 * @returns Boolean indicating if the collection exists
 */
export async function checkCollectionExists(
  supabase: SupabaseClientType,
  userId: string,
  collectionName: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from("flashcards")
      .select("flashcard_id")
      .eq("user_id", userId)
      .eq("collection", collectionName)
      .limit(1);

    if (error) {
      throw error;
    }

    return data.length > 0;
  } catch (error) {
    console.error("Error checking collection existence:", error);
    throw error;
  }
}

/**
 * Gets the count of flashcards in a collection
 * @param supabase The Supabase client instance
 * @param userId The user ID
 * @param collectionName The name of the collection
 * @returns The number of flashcards in the collection
 */
export async function getFlashcardsInCollectionCount(
  supabase: SupabaseClientType,
  userId: string,
  collectionName: string
): Promise<number> {
  try {
    const { error, count } = await supabase
      .from("flashcards")
      .select("flashcard_id", { count: "exact" })
      .eq("user_id", userId)
      .eq("collection", collectionName);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    console.error("Error counting flashcards in collection:", error);
    throw error;
  }
}

/**
 * Renames a collection by updating all flashcards with the specified collection name
 * @param supabase The Supabase client instance
 * @param userId The user ID to update collections for
 * @param currentName The current name of the collection to rename
 * @param newName The new name for the collection
 * @returns Object containing the count of updated flashcards and collectionExists flag
 */
export async function renameCollection(
  supabase: SupabaseClientType,
  userId: string,
  currentName: string,
  newName: string
): Promise<{ count: number; collectionExists: boolean }> {
  try {
    // First, check if the collection exists
    const collectionExists = await checkCollectionExists(supabase, userId, currentName);

    if (!collectionExists) {
      console.log(`Collection "${currentName}" does not exist for user ${userId}`);
      return { count: 0, collectionExists: false };
    }

    // Count flashcards before update to determine actual changes
    const flashcardsBeforeCount = await getFlashcardsInCollectionCount(supabase, userId, currentName);
    console.log(`Found ${flashcardsBeforeCount} flashcards in collection "${currentName}" before update`);

    // Check if the new collection name already exists for this user (only if different from current)
    if (currentName !== newName) {
      const { data: existingCollections, error: collectionQueryError } = await supabase
        .from("flashcards")
        .select("collection")
        .eq("user_id", userId)
        .eq("collection", newName);

      if (collectionQueryError) {
        console.error("Error checking for existing collection:", collectionQueryError);
        throw collectionQueryError;
      }

      // If collection with new name already exists
      if (existingCollections.length > 0) {
        throw new Error(`A collection with the name '${newName}' already exists`);
      }
    }

    // Execute the database update operation
    const {
      data,
      error,
      count: updateCount,
    } = await supabase
      .from("flashcards")
      .update({ collection: newName })
      .eq("user_id", userId)
      .eq("collection", currentName)
      .select();

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // Log the raw update operation results
    console.log(`Update operation returned: data length=${data?.length || 0}, updateCount=${updateCount}, data=`, data);

    // Use the length of returned data or original count if more reliable
    const actualCount = data?.length || flashcardsBeforeCount;

    // Log successful operation
    if (actualCount > 0) {
      console.log(
        `Collection renamed: "${currentName}" → "${newName}" for user ${userId}. ${actualCount} flashcards updated.`
      );
    } else {
      console.log(`Collection "${currentName}" exists but no flashcards were updated for user ${userId}.`);
    }

    return { count: actualCount, collectionExists: true };
  } catch (error) {
    console.error("Error renaming collection:", error);
    throw error;
  }
}

/**
 * Deletes a collection by removing all flashcards with the specified collection name
 * @param supabase The Supabase client instance
 * @param userId The user ID to delete collections for
 * @param collectionName The name of the collection to delete
 * @returns Object containing the count of deleted flashcards and collectionExists flag
 */
export async function deleteCollection(
  supabase: SupabaseClientType,
  userId: string,
  collectionName: string
): Promise<{ count: number; collectionExists: boolean }> {
  try {
    // First, check if the collection exists
    const collectionExists = await checkCollectionExists(supabase, userId, collectionName);

    if (!collectionExists) {
      console.log(`Collection "${collectionName}" does not exist for user ${userId}`);
      return { count: 0, collectionExists: false };
    }

    // Count flashcards before deletion to determine actual count
    const flashcardsCount = await getFlashcardsInCollectionCount(supabase, userId, collectionName);
    console.log(`Found ${flashcardsCount} flashcards in collection "${collectionName}" before deletion`);

    // Delete all flashcards in the collection
    const { error } = await supabase.from("flashcards").delete().eq("user_id", userId).eq("collection", collectionName);

    if (error) {
      console.error("Database error:", error);
      throw error;
    }

    // Log successful operation
    console.log(`Collection "${collectionName}" deleted for user ${userId}. ${flashcardsCount} flashcards deleted.`);

    return { count: flashcardsCount, collectionExists: true };
  } catch (error) {
    console.error("Error deleting collection:", error);
    throw error;
  }
}
