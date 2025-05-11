import React from "react";
import type { CollectionViewModel } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton"; // Assuming Skeleton is installed

interface CollectionItemProps {
  collection: CollectionViewModel;
  onRenameClick: (name: string) => void;
  onDeleteClick: (name: string) => void;
}

const CollectionItem: React.FC<CollectionItemProps> = ({ collection, onRenameClick, onDeleteClick }) => {
  const detailUrl = `/collections/${encodeURIComponent(collection.name)}`;

  const renderCount = () => {
    if (collection.isLoadingCount) {
      return <Skeleton className="h-4 w-20" />; // Placeholder size
    }
    if (collection.errorCount) {
      return <span className="text-red-500 text-sm">Loading error</span>;
    }
    return (
      <span className="text-sm text-muted-foreground">
        {collection.flashcardCount}
        {collection.flashcardCount === 1 ? " flashcard" : " flashcards"}
      </span>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{collection.name}</CardTitle>
      </CardHeader>
      <CardContent>{renderCount()}</CardContent>
      <CardFooter className="flex justify-between">
        {/* Use an anchor tag styled as button for navigation */}
        <Button asChild variant="outline" size="sm">
          <a href={detailUrl}>Details</a>
        </Button>
        <div className="space-x-2">
          <Button variant="outline" size="sm" onClick={() => onRenameClick(collection.name)}>
            Rename
          </Button>
          <Button size="sm" onClick={() => onDeleteClick(collection.name)}>
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default CollectionItem;
