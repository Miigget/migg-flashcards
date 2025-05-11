import React from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardFooter } from "../../ui/card";
import type { CandidateViewModel } from "../../../hooks/useGenerateFlashcards";

interface CandidateCardProps {
  candidate: CandidateViewModel;
  onAccept: (tempId: string) => void;
  onDiscard: (tempId: string) => void;
  onEditClick: (tempId: string) => void;
}

export default function CandidateCard({ candidate, onAccept, onDiscard, onEditClick }: CandidateCardProps) {
  return (
    <Card
      className={`
      ${
        candidate.status === "accepted"
          ? "border-primary/50 bg-primary/5"
          : candidate.status === "discarded"
            ? "border-muted-foreground/30 bg-muted/20 opacity-60"
            : "border-card"
      }
    `}
    >
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Front:</h3>
          <p className="p-2 bg-card rounded border">{candidate.front}</p>
        </div>
        <div>
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Back:</h3>
          <p className="p-2 bg-card rounded border">{candidate.back}</p>
        </div>
      </CardContent>

      <CardFooter className="px-4 pb-4 pt-0 flex justify-end gap-2">
        {candidate.status === "pending" ? (
          // Buttons in pending mode
          <>
            <Button variant="outline" size="sm" onClick={() => onDiscard(candidate.tempId)}>
              Discard
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEditClick(candidate.tempId)}>
              Edit
            </Button>
            <Button size="sm" onClick={() => onAccept(candidate.tempId)}>
              Accept
            </Button>
          </>
        ) : candidate.status === "accepted" ? (
          // Buttons in accepted mode
          <>
            <Button variant="outline" size="sm" onClick={() => onDiscard(candidate.tempId)}>
              Discard
            </Button>
            <Button variant="outline" size="sm" onClick={() => onEditClick(candidate.tempId)}>
              Edit
            </Button>
          </>
        ) : (
          // Buttons in discarded mode
          <Button variant="outline" size="sm" onClick={() => onAccept(candidate.tempId)}>
            Restore
          </Button>
        )}
      </CardFooter>
    </Card>
  );
}
