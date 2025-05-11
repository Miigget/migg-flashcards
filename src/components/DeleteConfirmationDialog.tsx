import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface DeleteConfirmationDialogProps {
  isOpen: boolean;
  itemType: string; // e.g., "kolekcję", "fiszkę"
  itemName: string;
  additionalInfo?: string; // e.g., "Spowoduje to usunięcie wszystkich X fiszek."
  onConfirm: () => Promise<void>; // Returns promise for async handling
  onCancel: () => void;
  isDeleting: boolean;
  error: string | null;
}

const DeleteConfirmationDialog: React.FC<DeleteConfirmationDialogProps> = ({
  isOpen,
  itemType,
  itemName,
  additionalInfo,
  onConfirm,
  onCancel,
  isDeleting,
  error,
}) => {
  const handleConfirm = async () => {
    try {
      await onConfirm();
      // Success handled by parent
    } catch (submitError) {
      // Error handled by parent via prop
      // eslint-disable-next-line no-console
      console.error("Delete confirmation failed:", submitError);
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      {" "}
      {/* Call onCancel when closing */}
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Confirm deletion</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete {itemType} &quot;{itemName}&quot;?
            {additionalInfo && <span className="mt-2 block">{additionalInfo}</span>}
          </DialogDescription>
        </DialogHeader>
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline" disabled={isDeleting}>
              Cancel
            </Button>
          </DialogClose>
          <Button type="button" onClick={handleConfirm} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Confirm"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DeleteConfirmationDialog;
