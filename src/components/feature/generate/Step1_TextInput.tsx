import React from "react";
import { Textarea } from "../../ui/textarea";
import { Button } from "../../ui/button";
import CharacterCounter from "../../ui/CharacterCounter";
import ErrorMessage from "../../ui/ErrorMessage";
import LoadingIndicator from "../../ui/LoadingIndicator";
import type { ApiError } from "../../../hooks/useGenerateFlashcards";

interface Step1_TextInputProps {
  text: string;
  validationError: string | null;
  isLoading: boolean;
  apiError: ApiError | null;
  onTextChange: (text: string) => void;
  onGenerateClick: () => void;
  onRetryGenerate: () => void;
}

export default function Step1_TextInput({
  text,
  validationError,
  isLoading,
  apiError,
  onTextChange,
  onGenerateClick,
  onRetryGenerate,
}: Step1_TextInputProps) {
  // Minimal required text length
  const MIN_TEXT_LENGTH = 100;
  // Maximum allowed text length
  const MAX_TEXT_LENGTH = 10000;

  // Whether the generate button should be disabled
  const isGenerateDisabled = isLoading || !!validationError || text.length < MIN_TEXT_LENGTH;

  // Handler for text change
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card p-6 rounded-lg border">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Enter text</h2>
          <p className="text-muted-foreground">
            Enter source text on which AI will generate flashcards. The text should contain at least {MIN_TEXT_LENGTH}{" "}
            characters.
          </p>
        </div>

        <div className="relative">
          <Textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Paste or type your text here..."
            className="min-h-[200px] resize-y"
            disabled={isLoading}
          />
          <CharacterCounter current={text.length} max={MAX_TEXT_LENGTH} className="mr-2" />

          {validationError && <ErrorMessage error={validationError} className="mt-2" />}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>{isLoading && <LoadingIndicator isLoading={true} text="Generating flashcards..." />}</div>

          <Button onClick={onGenerateClick} disabled={isGenerateDisabled} className="min-w-[150px]">
            Generate flashcards
          </Button>
        </div>
      </div>

      {apiError && <ErrorMessage error={apiError} showRetry={true} onRetry={onRetryGenerate} />}
    </div>
  );
}
