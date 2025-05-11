import React from "react";
import { AlertCircle } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { ApiError } from "@/types";

interface ErrorDisplayProps {
  error: ApiError | null;
  title?: string;
  message?: string;
  onRetry?: () => void;
  className?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  title = "Error occurred",
  message,
  onRetry,
  className,
}) => {
  if (!error) {
    return null;
  }

  const displayMessage = message || error.message || "Unknown error";
  const statusText = error.status ? ` (Status: ${error.status})` : "";

  return (
    <Alert variant="destructive" className={`my-4 ${className}`}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>
        {title}
        {statusText}
      </AlertTitle>
      <AlertDescription>
        {displayMessage}
        {/* Optionally display details if available */}
        {/* {error.details && <pre className="mt-2 text-xs whitespace-pre-wrap">{JSON.stringify(error.details, null, 2)}</pre>} */}
      </AlertDescription>
      {onRetry && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
    </Alert>
  );
};

export default ErrorDisplay;
