import React from "react";
import { Loader2 } from "lucide-react";

interface LoadingIndicatorProps {
  isLoading: boolean;
  className?: string;
  size?: "sm" | "md" | "lg";
  text?: string;
}

export default function LoadingIndicator({ isLoading, className = "", size = "md", text }: LoadingIndicatorProps) {
  if (!isLoading) return null;

  const sizeMap = {
    sm: "h-4 w-4",
    md: "h-5 w-5",
    lg: "h-6 w-6",
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`${sizeMap[size]} animate-spin mr-2`} />
      {text && <span className="text-sm">{text}</span>}
    </div>
  );
}
