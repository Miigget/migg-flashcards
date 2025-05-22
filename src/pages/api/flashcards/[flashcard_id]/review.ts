import type { APIRoute } from "astro";
import { z } from "zod";
import { fsrs, State } from "ts-fsrs";

export const prerender = false;

// Schema for validating flashcard ID from the URL
const paramsSchema = z.object({
  flashcard_id: z.string().transform((val) => parseInt(val, 10)),
});

// Schema for validating the review data in the request body
const reviewSchema = z.object({
  rating: z.number().int().min(1).max(4),
});

export const POST: APIRoute = async ({ params, request, locals }) => {
  try {
    // Validate flashcard ID from URL
    const validatedParams = paramsSchema.safeParse(params);
    if (!validatedParams.success) {
      return new Response(JSON.stringify({ error: "Invalid flashcard ID", details: validatedParams.error }), {
        status: 400,
      });
    }

    const { flashcard_id } = validatedParams.data;

    // Parse and validate request body
    const body = await request.json();
    const validatedBody = reviewSchema.safeParse(body);

    if (!validatedBody.success) {
      return new Response(JSON.stringify({ error: "Invalid review data", details: validatedBody.error }), {
        status: 400,
      });
    }

    const { rating } = validatedBody.data;

    // Ensure user is authenticated
    const supabase = locals.supabase;
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
    }

    const userId = session.user.id;

    // Fetch the flashcard to ensure it exists and belongs to the user
    const { data: flashcard, error: flashcardError } = await supabase
      .from("flashcards")
      .select("*")
      .eq("flashcard_id", flashcard_id)
      .eq("user_id", userId)
      .single();

    if (flashcardError || !flashcard) {
      return new Response(
        JSON.stringify({ error: "Flashcard not found or does not belong to the user", details: flashcardError }),
        { status: 404 }
      );
    }

    // Fetch existing SRS metadata if it exists
    const { data: existingMetadata, error: metadataError } = await supabase
      .from("flashcard_srs_metadata")
      .select("*")
      .eq("flashcard_id", flashcard_id)
      .eq("user_id", userId)
      .maybeSingle();

    if (metadataError) {
      return new Response(JSON.stringify({ error: "Failed to fetch SRS metadata", details: metadataError }), {
        status: 500,
      });
    }

    // Initialize the FSRS algorithm
    const f = fsrs();
    const now = new Date();

    // Create or update the SRS card
    let cardState;

    if (existingMetadata) {
      // Use existing metadata to create an FSRS card
      cardState = {
        due: new Date(existingMetadata.due),
        stability: existingMetadata.stability,
        difficulty: existingMetadata.difficulty,
        elapsed_days: existingMetadata.elapsed_days,
        scheduled_days: existingMetadata.scheduled_days,
        reps: existingMetadata.reps,
        lapses: existingMetadata.lapses,
        state: existingMetadata.state,
        last_review: existingMetadata.last_review ? new Date(existingMetadata.last_review) : null,
        // Note: ts-fsrs expects these properties but the type definition may be incomplete
        learning_steps: 1, // Default for learning steps
      };
    } else {
      // Create a new card state
      cardState = {
        due: now,
        stability: 0,
        difficulty: 0,
        elapsed_days: 0,
        scheduled_days: 0,
        reps: 0,
        lapses: 0,
        state: State.New,
        last_review: null,
        learning_steps: 1,
      };
    }

    // Calculate the next state using FSRS
    // In FSRS, Rating.Again (1) to Rating.Easy (4) map to Grade 1-4
    // The rating numbers (1-4) align with the Grade enum used in fsrs.next()
    const recordLogItem = f.next(cardState, now, rating);
    const { card: updatedCard, log } = recordLogItem;

    // Prepare metadata for storage
    const srsMetadata = {
      flashcard_id,
      user_id: userId,
      due: updatedCard.due.toISOString(),
      stability: updatedCard.stability,
      difficulty: updatedCard.difficulty,
      elapsed_days: updatedCard.elapsed_days,
      scheduled_days: updatedCard.scheduled_days,
      reps: updatedCard.reps,
      lapses: updatedCard.lapses,
      state: updatedCard.state,
      last_review: now.toISOString(),
    };

    // Upsert the SRS metadata
    const { data: upsertedMetadata, error: upsertError } = await supabase
      .from("flashcard_srs_metadata")
      .upsert(srsMetadata)
      .select()
      .single();

    if (upsertError) {
      return new Response(JSON.stringify({ error: "Failed to update SRS metadata", details: upsertError }), {
        status: 500,
      });
    }

    // Return the updated card with its SRS metadata
    return new Response(
      JSON.stringify({
        flashcard,
        fsrsCard: updatedCard,
        srsMetadata: upsertedMetadata,
        log,
      }),
      { status: 200 }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : String(error),
      }),
      { status: 500 }
    );
  }
};
