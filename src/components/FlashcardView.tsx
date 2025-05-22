import { useState, useEffect } from "react";
import { Card, CardContent } from "./ui/card";
import type { SpacedRepetitionCard } from "@/types";

interface FlashcardViewProps {
  flashcard: SpacedRepetitionCard;
  isFrontVisible: boolean;
  onFlip: () => void;
}

export default function FlashcardView({ flashcard, isFrontVisible, onFlip }: FlashcardViewProps) {
  const [isFlipping, setIsFlipping] = useState(false);

  // Reset flipping animation when isFrontVisible changes
  useEffect(() => {
    setIsFlipping(true);
    const timer = setTimeout(() => {
      setIsFlipping(false);
    }, 300); // Match this with the CSS transition duration

    return () => clearTimeout(timer);
  }, [isFrontVisible]);

  return (
    <button
      className="w-full max-w-xl my-8 perspective-1000 cursor-pointer focus:outline-none rounded-md"
      onClick={onFlip}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          onFlip();
        }
      }}
      aria-label={`Flashcard: ${flashcard.front}. Press to flip the card.`}
      type="button"
    >
      <div
        className={`relative w-full transition-transform duration-300 transform-style-3d ${
          isFlipping ? "scale-95" : "scale-100"
        } ${isFrontVisible ? "" : "rotate-y-180"}`}
        style={{ height: "300px" }}
      >
        {/* Front of card */}
        <Card
          className={`absolute w-full h-full backface-hidden border-2 border-border shadow-md ${
            isFrontVisible ? "z-10" : "z-0"
          }`}
        >
          <CardContent className="p-8 h-full flex flex-col items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1 text-muted-foreground">Front</h3>
              <div className="text-xl">{flashcard.front}</div>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">Click to flip</div>
          </CardContent>
        </Card>

        {/* Back of card */}
        <Card
          className={`absolute w-full h-full backface-hidden rotate-y-180 border-2 border-border shadow-md ${
            isFrontVisible ? "z-0" : "z-10"
          }`}
        >
          <CardContent className="p-8 h-full flex flex-col items-center justify-center">
            <div className="text-center">
              <h3 className="text-lg font-semibold mb-1 text-muted-foreground">Back</h3>
              <div className="text-xl">{flashcard.back}</div>
            </div>

            <div className="mt-8 text-sm text-muted-foreground">Rate your answer below</div>
          </CardContent>
        </Card>
      </div>
    </button>
  );
}
