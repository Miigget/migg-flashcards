import React from "react";
import { Button } from "./button";
import { AlertTriangle } from "lucide-react";
import type { ApiError } from "../../hooks/useGenerateFlashcards";

interface ErrorMessageProps {
  error: ApiError | string | null;
  showRetry?: boolean;
  onRetry?: () => void;
  className?: string;
}

export default function ErrorMessage({ error, showRetry = false, onRetry, className = "" }: ErrorMessageProps) {
  if (!error) return null;

  const errorMessage = typeof error === "string" ? error : error.message;

  return (
    <div className={`bg-destructive/15 text-destructive p-3 rounded-md flex items-start mt-2 ${className}`}>
      <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />
      <div className="ml-3 flex-grow">
        <p className="text-sm font-medium">{errorMessage}</p>
        {showRetry && onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2 h-8 text-xs bg-background hover:bg-background/80"
          >
            Spróbuj ponownie
          </Button>
        )}
      </div>
    </div>
  );
}
