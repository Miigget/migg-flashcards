import type { APIRoute } from "astro";
import { z } from "zod";
import type { CreateCollectionCommand } from "../../../types";

// Mockowe dane dla kolekcji w celach testowych
const mockCollections = [
  { id: "1", name: "Spanish" },
  { id: "2", name: "JavaScript" },
  { id: "3", name: "Biology" },
  { id: "4", name: "History" },
];

// Schema dla walidacji tworzenia nowej kolekcji
const createCollectionSchema = z.object({
  name: z
    .string()
    .min(2, { message: "Collection name must be at least 2 characters long" })
    .max(50, { message: "Collection name cannot exceed 50 characters" }),
});

export const prerender = false;

// GET endpoint do pobierania wszystkich kolekcji
export const GET: APIRoute = async () => {
  try {
    // Symulacja opóźnienia odpowiedzi API
    await new Promise((resolve) => setTimeout(resolve, 300));

    return new Response(JSON.stringify(mockCollections), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching collections:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while fetching collections",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

// POST endpoint do tworzenia nowej kolekcji
export const POST: APIRoute = async ({ request }) => {
  try {
    // Parsowanie ciała żądania
    const body = (await request.json()) as CreateCollectionCommand;

    // Walidacja danych wejściowych
    const validation = createCollectionSchema.safeParse(body);

    if (!validation.success) {
      return new Response(
        JSON.stringify({
          error: "Bad Request",
          message: validation.error.format(),
          status: 400,
        }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Symulacja tworzenia nowej kolekcji
    const newCollection = {
      id: `${mockCollections.length + 1}`,
      name: validation.data.name,
    };

    // W prawdziwej implementacji zapisalibyśmy to do bazy danych
    mockCollections.push(newCollection);

    return new Response(JSON.stringify(newCollection), {
      status: 201,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error creating collection:", error);

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An error occurred while creating a collection",
        status: 500,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};
