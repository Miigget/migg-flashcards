import type { APIRoute } from "astro";
import { z } from "zod";

export const prerender = false;

// Schema for validating collection name from the URL
const paramsSchema = z.object({
  collection_name: z.string(),
});

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    // Validate collection name from URL
    const validatedParams = paramsSchema.safeParse(params);
    if (!validatedParams.success) {
      return new Response(JSON.stringify({ error: "Invalid collection name", details: validatedParams.error }), {
        status: 400,
      });
    }

    const { collection_name } = validatedParams.data;

    // Ensure user is authenticated
    const supabase = locals.supabase;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const userId = session.user.id;

    // Fetch all flashcards for the collection
    const { data: flashcards, error: flashcardsError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("user_id", userId)
      .eq("collection", collection_name);

    if (flashcardsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch flashcards", details: flashcardsError }), {
        status: 500,
      });
    }

    if (!flashcards || flashcards.length === 0) {
      return new Response(JSON.stringify([]), { status: 200 });
    }

    // Get flashcard IDs for the JOIN with SRS metadata
    const flashcardIds = flashcards.map((card) => card.flashcard_id);

    // Fetch SRS metadata for these flashcards
    const { data: srsMetadata, error: srsError } = await supabase
      .from("flashcard_srs_metadata")
      .select("*")
      .eq("user_id", userId)
      .in("flashcard_id", flashcardIds);

    if (srsError) {
      return new Response(JSON.stringify({ error: "Failed to fetch SRS metadata", details: srsError }), {
        status: 500,
      });
    }

    // Combine flashcards with their SRS metadata
    const flashcardsWithSrs = flashcards.map((flashcard) => {
      const metadata = srsMetadata?.find((meta) => meta.flashcard_id === flashcard.flashcard_id);

      // Default FSRS card state for new cards
      const defaultFsrsState = {
        due: new Date(),
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: 0, // New state
        last_review: null,
      };

      // If we have metadata, use it to create the FSRS card state
      const fsrsCard = metadata
        ? {
            due: new Date(metadata.due),
            stability: metadata.stability,
            difficulty: metadata.difficulty,
            elapsed_days: metadata.elapsed_days,
            scheduled_days: metadata.scheduled_days,
            reps: metadata.reps,
            lapses: metadata.lapses,
            state: metadata.state,
            last_review: metadata.last_review ? new Date(metadata.last_review) : null,
          }
        : defaultFsrsState;

      // Create a SpacedRepetitionCard with the flashcard data and FSRS state
      return {
        ...flashcard,
        fsrsCard,
        history: [], // We're not returning history for now
      };
    });

    return new Response(JSON.stringify(flashcardsWithSrs), {
      status: 200,
    });
  } catch (error) {
    console.error("Error in study endpoint:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
};
