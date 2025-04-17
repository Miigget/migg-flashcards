import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { ReviewableCandidateViewModel } from "./types";

interface EditCandidateModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: ReviewableCandidateViewModel;
  onSave: (id: string, front: string, back: string) => void;
}

export const EditCandidateModal = ({ isOpen, onClose, candidate, onSave }: EditCandidateModalProps) => {
  const [front, setFront] = useState(candidate.front);
  const [back, setBack] = useState(candidate.back);
  const [frontError, setFrontError] = useState("");
  const [backError, setBackError] = useState("");

  // Reset form when candidate changes
  useEffect(() => {
    setFront(candidate.front);
    setBack(candidate.back);
    setFrontError("");
    setBackError("");
  }, [candidate]);

  // Validate form input
  const validateForm = () => {
    let isValid = true;

    if (!front.trim()) {
      setFrontError("Front content is required");
      isValid = false;
    } else if (front.length > 200) {
      setFrontError("Front content must be less than 200 characters");
      isValid = false;
    } else {
      setFrontError("");
    }

    if (!back.trim()) {
      setBackError("Back content is required");
      isValid = false;
    } else if (back.length > 500) {
      setBackError("Back content must be less than 500 characters");
      isValid = false;
    } else {
      setBackError("");
    }

    return isValid;
  };

  // Handle front text change
  const handleFrontChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFront(e.target.value);

    if (e.target.value.length > 200) {
      setFrontError("Front content must be less than 200 characters");
    } else {
      setFrontError("");
    }
  };

  // Handle back text change
  const handleBackChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setBack(e.target.value);

    if (e.target.value.length > 500) {
      setBackError("Back content must be less than 500 characters");
    } else {
      setBackError("");
    }
  };

  // Handle save button click
  const handleSave = () => {
    if (validateForm()) {
      onSave(candidate.id, front, back);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Flashcard</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="front-content" className="flex justify-between">
              <span>Front</span>
              <span className={`text-xs ${front.length > 200 ? "text-destructive" : "text-muted-foreground"}`}>
                {front.length}/200
              </span>
            </Label>
            <Textarea
              id="front-content"
              value={front}
              onChange={handleFrontChange}
              placeholder="Enter the front side content"
              className="resize-none"
              rows={3}
            />
            {frontError && <p className="text-xs text-destructive">{frontError}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="back-content" className="flex justify-between">
              <span>Back</span>
              <span className={`text-xs ${back.length > 500 ? "text-destructive" : "text-muted-foreground"}`}>
                {back.length}/500
              </span>
            </Label>
            <Textarea
              id="back-content"
              value={back}
              onChange={handleBackChange}
              placeholder="Enter the back side content"
              className="resize-none"
              rows={5}
            />
            {backError && <p className="text-xs text-destructive">{backError}</p>}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={!!frontError || !!backError}>
            Save Changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
