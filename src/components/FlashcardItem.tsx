import React from "react";
import type { FlashcardDTO } from "@/types";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface FlashcardItemProps {
  flashcard: FlashcardDTO;
  onEditClick: (flashcard: FlashcardDTO) => void;
  onDeleteClick: (id: number) => void;
}

const FlashcardItem: React.FC<FlashcardItemProps> = ({ flashcard, onEditClick, onDeleteClick }) => {
  return (
    <Card>
      <CardHeader>
        {/* Using CardTitle for front, but could be CardDescription too */}
        <CardTitle className="text-lg font-medium">{flashcard.front}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">{flashcard.back}</p>
      </CardContent>
      <CardFooter className="flex justify-end space-x-2">
        <Button variant="ghost" size="sm" onClick={() => onEditClick(flashcard)}>
          Edytuj
        </Button>
        <Button variant="destructive" size="sm" onClick={() => onDeleteClick(flashcard.flashcard_id)}>
          Usuń
        </Button>
      </CardFooter>
    </Card>
  );
};

export default FlashcardItem;
