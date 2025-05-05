import React, { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose, // Import DialogClose for the Cancel button
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label"; // Import Label for better accessibility
import { AlertCircle } from "lucide-react"; // For error icon
import { Alert, AlertDescription } from "@/components/ui/alert"; // For displaying errors

interface RenameCollectionDialogProps {
  isOpen: boolean;
  currentName: string;
  // Returns promise to indicate async operation; resolves on success, rejects on error
  onRenameSubmit: (newName: string) => Promise<void>;
  onCancel: () => void;
  existingNames?: string[]; // Optional: For client-side unique check
  isSubmitting: boolean;
  error: string | null; // Error message from submission attempt
}

const MAX_NAME_LENGTH = 30;

const RenameCollectionDialog: React.FC<RenameCollectionDialogProps> = ({
  isOpen,
  currentName,
  onRenameSubmit,
  onCancel,
  existingNames = [],
  isSubmitting,
  error,
}) => {
  const [newName, setNewName] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  // Reset name when dialog opens with a new target
  useEffect(() => {
    if (isOpen) {
      setNewName(currentName); // Start with the current name in the input
      setValidationError(null); // Clear previous validation errors
    }
  }, [isOpen, currentName]);

  const validateName = useCallback(
    (name: string): boolean => {
      if (!name.trim()) {
        setValidationError("Nazwa kolekcji nie może być pusta.");
        return false;
      }
      if (name.length > MAX_NAME_LENGTH) {
        setValidationError(`Nazwa kolekcji nie może przekraczać ${MAX_NAME_LENGTH} znaków.`);
        return false;
      }
      if (name === currentName) {
        // No change, technically valid but maybe disable submit? Or handle in submit.
        setValidationError(null); // Or maybe "Nazwa nie została zmieniona."
        return true; // Allow submission to close dialog
      }
      if (existingNames.includes(name)) {
        setValidationError("Kolekcja o tej nazwie już istnieje.");
        return false;
      }
      setValidationError(null);
      return true;
    },
    [currentName, existingNames]
  );

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setNewName(value);
    validateName(value); // Validate on change
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!validateName(newName) || isSubmitting || newName === currentName) {
      // Don't submit if invalid, already submitting, or name hasn't changed
      if (newName === currentName) onCancel(); // Close if name is unchanged
      return;
    }

    try {
      await onRenameSubmit(newName);
      // Success is handled by the parent (closing the dialog)
    } catch (submitError) {
      // Error is handled by the parent via the 'error' prop
      // eslint-disable-next-line no-console
      console.error("Rename submission failed:", submitError);
    }
  };

  // Update validation on prop changes (e.g., existingNames updated after initial open)
  useEffect(() => {
    if (isOpen) {
      validateName(newName);
    }
  }, [existingNames, newName, isOpen, validateName]);

  const canSubmit = !validationError && !isSubmitting && newName.trim() !== "" && newName !== currentName;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      {" "}
      {/* Call onCancel when closing */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Zmień nazwę kolekcji</DialogTitle>
          <DialogDescription>Wprowadź nową nazwę dla kolekcji &quot;{currentName}&quot;.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="collection-name" className="text-right">
                Nowa nazwa
              </Label>
              <Input
                id="collection-name"
                value={newName}
                onChange={handleInputChange}
                className="col-span-3"
                maxLength={MAX_NAME_LENGTH + 5} // Allow typing slightly over limit to show validation
                disabled={isSubmitting}
              />
            </div>
            {(validationError || error) && (
              <Alert variant="destructive" className="col-span-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{validationError || error}</AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Anuluj
              </Button>
            </DialogClose>
            <Button type="submit" disabled={!canSubmit}>
              {isSubmitting ? "Zapisywanie..." : "Zapisz"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default RenameCollectionDialog;
