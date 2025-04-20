import React, { useState, useEffect } from "react";
import { Button } from "../../ui/button";
import { Input } from "../../ui/input";
import { Textarea } from "../../ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "../../ui/dialog";
import CharacterCounter from "../../ui/CharacterCounter";
import ErrorMessage from "../../ui/ErrorMessage";
import type { CandidateViewModel } from "../../../hooks/useGenerateFlashcards";

interface EditCandidateModalProps {
  candidate: CandidateViewModel;
  isOpen: boolean;
  onClose: () => void;
  onSave: (candidate: CandidateViewModel) => void;
}

export default function EditCandidateModal({ candidate, isOpen, onClose, onSave }: EditCandidateModalProps) {
  // Stan lokalny dla pól formularza edycji
  const [editedFront, setEditedFront] = useState(candidate.front);
  const [editedBack, setEditedBack] = useState(candidate.back);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  // Limity znaków
  const MAX_FRONT_LENGTH = 200;
  const MAX_BACK_LENGTH = 500;

  // Resetowanie stanu formularza gdy otworzymy modal z nowym kandydatem
  useEffect(() => {
    if (isOpen) {
      setEditedFront(candidate.front);
      setEditedBack(candidate.back);
      setFrontError(null);
      setBackError(null);
    }
  }, [isOpen, candidate]);

  // Walidacja pól
  const validateFields = (): boolean => {
    let isValid = true;

    if (editedFront.trim() === "") {
      setFrontError("Przód fiszki nie może być pusty");
      isValid = false;
    } else if (editedFront.length > MAX_FRONT_LENGTH) {
      setFrontError(`Przód fiszki nie może przekraczać ${MAX_FRONT_LENGTH} znaków`);
      isValid = false;
    } else {
      setFrontError(null);
    }

    if (editedBack.trim() === "") {
      setBackError("Tył fiszki nie może być pusty");
      isValid = false;
    } else if (editedBack.length > MAX_BACK_LENGTH) {
      setBackError(`Tył fiszki nie może przekraczać ${MAX_BACK_LENGTH} znaków`);
      isValid = false;
    } else {
      setBackError(null);
    }

    return isValid;
  };

  // Obsługa zapisu
  const handleSave = () => {
    if (validateFields()) {
      onSave({
        ...candidate,
        front: editedFront,
        back: editedBack,
      });
      onClose();
    }
  };

  // Czy przycisk zapisu powinien być nieaktywny
  const isSaveDisabled =
    editedFront.trim() === "" ||
    editedBack.trim() === "" ||
    editedFront.length > MAX_FRONT_LENGTH ||
    editedBack.length > MAX_BACK_LENGTH;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edytuj fiszkę</DialogTitle>
          <DialogDescription>
            Edytuj treść przodu i tyłu fiszki. Kliknij &quot;Zapisz&quot; gdy skończysz.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="front" className="text-sm font-medium">
              Przód fiszki
            </label>
            <Input
              id="front"
              value={editedFront}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedFront(e.target.value)}
              placeholder="Wprowadź tekst przodu fiszki..."
              className="w-full"
            />
            <CharacterCounter current={editedFront.length} max={MAX_FRONT_LENGTH} />
            {frontError && <ErrorMessage error={frontError} />}
          </div>

          <div className="grid gap-2">
            <label htmlFor="back" className="text-sm font-medium">
              Tył fiszki
            </label>
            <Textarea
              id="back"
              value={editedBack}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedBack(e.target.value)}
              placeholder="Wprowadź tekst tyłu fiszki..."
              className="w-full min-h-[100px]"
            />
            <CharacterCounter current={editedBack.length} max={MAX_BACK_LENGTH} />
            {backError && <ErrorMessage error={backError} />}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Anuluj
          </Button>
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            Zapisz
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
