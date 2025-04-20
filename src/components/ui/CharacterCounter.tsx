import React from "react";

interface CharacterCounterProps {
  current: number;
  max: number;
  className?: string;
}

export default function CharacterCounter({ current, max, className = "" }: CharacterCounterProps) {
  const isOverLimit = current > max;

  return (
    <div className={`text-xs mt-1 text-right ${className}`}>
      <span className={isOverLimit ? "text-destructive font-medium" : "text-muted-foreground"}>{current}</span>
      <span className="text-muted-foreground">/{max}</span>
    </div>
  );
}
