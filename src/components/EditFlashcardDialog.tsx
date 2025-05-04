import React, { useState, useEffect } from "react";
import type { FlashcardDTO } from "@/types";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Use Textarea for back
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
// import CollectionSelector from "@/components/ui/CollectionSelector"; // Import if needed for changing collection

interface EditFlashcardDialogProps {
  isOpen: boolean;
  flashcard: FlashcardDTO | null;
  onEditSubmit: (
    flashcardId: number,
    updates: Partial<Pick<FlashcardDTO, "front" | "back" | "collection">>
  ) => Promise<void>;
  onCancel: () => void;
  isSubmitting: boolean;
  error: string | null;
}

const MAX_FRONT_LENGTH = 200;
const MAX_BACK_LENGTH = 500;

const EditFlashcardDialog: React.FC<EditFlashcardDialogProps> = ({
  isOpen,
  flashcard,
  onEditSubmit,
  onCancel,
  isSubmitting,
  error,
}) => {
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  // const [collection, setCollection] = useState(''); // Add if collection editing is enabled
  const [validationErrors, setValidationErrors] = useState<{ front?: string; back?: string }>({});

  useEffect(() => {
    // Only reset state when the dialog opens or the flashcard prop changes while open
    if (isOpen && flashcard) {
      setFront(flashcard.front);
      setBack(flashcard.back);
      // setCollection(flashcard.collection);
      setValidationErrors({}); // Clear previous errors
    }
    // Remove the else block that cleared state when closing.
    // The component state will be fresh if it remounts, or this effect will set it correctly when isOpen becomes true.
  }, [isOpen, flashcard]);

  const validateFields = (): boolean => {
    const errors: { front?: string; back?: string } = {};
    if (!front.trim()) {
      errors.front = "Pole 'Przód' nie może być puste.";
    }
    if (front.length > MAX_FRONT_LENGTH) {
      errors.front = `Pole 'Przód' nie może przekraczać ${MAX_FRONT_LENGTH} znaków.`;
    }
    if (!back.trim()) {
      errors.back = "Pole 'Tył' nie może być puste.";
    }
    if (back.length > MAX_BACK_LENGTH) {
      errors.back = `Pole 'Tył' nie może przekraczać ${MAX_BACK_LENGTH} znaków.`;
    }
    // Add collection validation if enabled

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateFields() || isSubmitting || !flashcard) {
      return;
    }

    // Check if anything actually changed
    const updates: Partial<Pick<FlashcardDTO, "front" | "back" | "collection">> = {};
    if (front !== flashcard.front) updates.front = front;
    if (back !== flashcard.back) updates.back = back;
    // if (collection !== flashcard.collection) updates.collection = collection;

    if (Object.keys(updates).length === 0) {
      onCancel(); // Close dialog if nothing changed
      return;
    }

    try {
      await onEditSubmit(flashcard.flashcard_id, updates);
      // Success handled by parent
    } catch (submitError) {
      // Error handled by parent via prop
      console.error("Edit flashcard submission failed:", submitError);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>Zmień zawartość fiszki.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            {/* Front Field */}
            <div className="grid gap-2">
              <Label htmlFor="flashcard-front">Przód</Label>
              <Input
                id="flashcard-front"
                value={front}
                onChange={(e) => setFront(e.target.value)}
                maxLength={MAX_FRONT_LENGTH + 10} // Allow typing slightly over
                disabled={isSubmitting}
                aria-invalid={!!validationErrors.front}
                aria-describedby={validationErrors.front ? "front-error" : undefined}
              />
              {validationErrors.front && (
                <p id="front-error" className="text-sm text-red-500">
                  {validationErrors.front}
                </p>
              )}
            </div>

            {/* Back Field */}
            <div className="grid gap-2">
              <Label htmlFor="flashcard-back">Tył</Label>
              <Textarea
                id="flashcard-back"
                value={back}
                onChange={(e) => setBack(e.target.value)}
                maxLength={MAX_BACK_LENGTH + 10} // Allow typing slightly over
                disabled={isSubmitting}
                aria-invalid={!!validationErrors.back}
                aria-describedby={validationErrors.back ? "back-error" : undefined}
                rows={4}
              />
              {validationErrors.back && (
                <p id="back-error" className="text-sm text-red-500">
                  {validationErrors.back}
                </p>
              )}
            </div>

            {/* TODO: Add Collection Selector if needed */}

            {/* Submission Error */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Anuluj
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isSubmitting || Object.keys(validationErrors).length > 0}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz zmiany"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default EditFlashcardDialog;
