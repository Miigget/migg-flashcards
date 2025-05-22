import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import type { CollectionViewModel, PaginatedResponse, FlashcardDTO } from "@/types";

export default function CollectionSelector() {
  const [collections, setCollections] = useState<CollectionViewModel[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        setIsLoading(true);
        const response = await fetch("/api/collections");

        if (!response.ok) {
          throw new Error(`Failed to fetch collections: ${response.status}`);
        }

        const collectionNames: string[] = await response.json();

        // Initialize collection view models
        const initialCollections = collectionNames.map((name) => ({
          name,
          flashcardCount: null,
          isLoadingCount: true,
          errorCount: null,
        }));

        setCollections(initialCollections);

        // Fetch flashcard counts for each collection
        const updatedCollections = await Promise.all(
          collectionNames.map(async (name) => {
            try {
              // Use the existing flashcards endpoint with pagination to get count
              const countResponse = await fetch(
                `/api/flashcards?collection=${encodeURIComponent(name)}&limit=1&page=1`
              );

              if (!countResponse.ok) {
                return {
                  name,
                  flashcardCount: null,
                  isLoadingCount: false,
                  errorCount: { status: countResponse.status, message: "Failed to fetch count" },
                };
              }

              const data: PaginatedResponse<FlashcardDTO> = await countResponse.json();
              return {
                name,
                flashcardCount: data.total,
                isLoadingCount: false,
                errorCount: null,
              };
            } catch (err) {
              return {
                name,
                flashcardCount: null,
                isLoadingCount: false,
                errorCount: {
                  status: 500,
                  message: err instanceof Error ? err.message : "Failed to load count",
                },
              };
            }
          })
        );

        setCollections(updatedCollections);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load collections");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, []);

  const handleSelectCollection = (collectionName: string) => {
    window.location.href = `/study?collection=${encodeURIComponent(collectionName)}`;
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-2xl">
        <h2 className="text-xl font-semibold mb-4">Your Collections</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array(4)
            .fill(0)
            .map((_, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <Skeleton className="h-6 w-24 mb-2" />
                  <Skeleton className="h-4 w-16" />
                </CardContent>
              </Card>
            ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-2xl text-center">
        <h2 className="text-xl font-semibold mb-4 text-red-600">Error Loading Collections</h2>
        <p className="mb-4">{error}</p>
        <Button onClick={() => window.location.reload()}>Try Again</Button>
      </div>
    );
  }

  if (collections.length === 0) {
    return (
      <div className="w-full max-w-2xl text-center">
        <h2 className="text-xl font-semibold mb-4">No Collections Found</h2>
        <p className="mb-4">You don&apos;t have any collections yet. Create your first collection to start studying.</p>
        <Button onClick={() => (window.location.href = "/collections/new")}>Create Collection</Button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl">
      <h2 className="text-xl font-semibold mb-4">Your Collections</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {collections.map((collection) => (
          <Card
            key={collection.name}
            className="hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleSelectCollection(collection.name)}
          >
            <CardContent className="p-6">
              <h3 className="text-lg font-medium mb-2">{collection.name}</h3>
              <p className="text-sm text-muted-foreground">
                {collection.isLoadingCount ? (
                  <Skeleton className="h-4 w-16 inline-block" />
                ) : collection.flashcardCount !== null ? (
                  `${collection.flashcardCount} ${collection.flashcardCount === 1 ? "flashcard" : "flashcards"}`
                ) : collection.errorCount ? (
                  "Error loading count"
                ) : (
                  "0 flashcards"
                )}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
