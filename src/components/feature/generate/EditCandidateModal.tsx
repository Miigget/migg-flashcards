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
  // Local state for form fields
  const [editedFront, setEditedFront] = useState(candidate.front);
  const [editedBack, setEditedBack] = useState(candidate.back);
  const [frontError, setFrontError] = useState<string | null>(null);
  const [backError, setBackError] = useState<string | null>(null);

  // Character limits
  const MAX_FRONT_LENGTH = 200;
  const MAX_BACK_LENGTH = 500;

  // Resetting form state when opening modal with new candidate
  useEffect(() => {
    if (isOpen) {
      setEditedFront(candidate.front);
      setEditedBack(candidate.back);
      setFrontError(null);
      setBackError(null);
    }
  }, [isOpen, candidate]);

  // Field validation
  const validateFields = (): boolean => {
    let isValid = true;

    if (editedFront.trim() === "") {
      setFrontError("Front of flashcard cannot be empty");
      isValid = false;
    } else if (editedFront.length > MAX_FRONT_LENGTH) {
      setFrontError(`Front of flashcard cannot exceed ${MAX_FRONT_LENGTH} characters`);
      isValid = false;
    } else {
      setFrontError(null);
    }

    if (editedBack.trim() === "") {
      setBackError("Back of flashcard cannot be empty");
      isValid = false;
    } else if (editedBack.length > MAX_BACK_LENGTH) {
      setBackError(`Back of flashcard cannot exceed ${MAX_BACK_LENGTH} characters`);
      isValid = false;
    } else {
      setBackError(null);
    }

    return isValid;
  };

  // Save handling
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

  // Whether the save button should be disabled
  const isSaveDisabled =
    editedFront.trim() === "" ||
    editedBack.trim() === "" ||
    editedFront.length > MAX_FRONT_LENGTH ||
    editedBack.length > MAX_BACK_LENGTH;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit flashcard</DialogTitle>
          <DialogDescription>
            Edit the front and back of the flashcard. Click &quot;Save&quot; when you're done.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <label htmlFor="front" className="text-sm font-medium">
              Front of flashcard
            </label>
            <Input
              id="front"
              value={editedFront}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedFront(e.target.value)}
              placeholder="Enter the front text of the flashcard..."
              className="w-full"
            />
            <CharacterCounter current={editedFront.length} max={MAX_FRONT_LENGTH} />
            {frontError && <ErrorMessage error={frontError} />}
          </div>

          <div className="grid gap-2">
            <label htmlFor="back" className="text-sm font-medium">
              Back of flashcard
            </label>
            <Textarea
              id="back"
              value={editedBack}
              onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedBack(e.target.value)}
              placeholder="Enter the back text of the flashcard..."
              className="w-full min-h-[100px]"
            />
            <CharacterCounter current={editedBack.length} max={MAX_BACK_LENGTH} />
            {backError && <ErrorMessage error={backError} />}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={isSaveDisabled}>
            Save
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
