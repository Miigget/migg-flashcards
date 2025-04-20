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
  // Minimalna wymagana długość tekstu
  const MIN_TEXT_LENGTH = 100;
  // Maksymalna dozwolona długość tekstu
  const MAX_TEXT_LENGTH = 10000;

  // Czy przycisk generowania powinien być nieaktywny
  const isGenerateDisabled = isLoading || !!validationError || text.length < MIN_TEXT_LENGTH;

  // Handler dla zmiany tekstu
  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onTextChange(e.target.value);
  };

  return (
    <div className="space-y-4">
      <div className="bg-card p-6 rounded-lg border">
        <div className="mb-4">
          <h2 className="text-xl font-semibold mb-2">Wprowadź tekst</h2>
          <p className="text-muted-foreground">
            Wprowadź tekst, na podstawie którego AI wygeneruje fiszki. Tekst powinien zawierać co najmniej{" "}
            {MIN_TEXT_LENGTH} znaków.
          </p>
        </div>

        <div className="relative">
          <Textarea
            value={text}
            onChange={handleTextChange}
            placeholder="Wklej lub wpisz tutaj swój tekst..."
            className="min-h-[200px] resize-y"
            disabled={isLoading}
          />
          <CharacterCounter current={text.length} max={MAX_TEXT_LENGTH} className="mr-2" />

          {validationError && <ErrorMessage error={validationError} className="mt-2" />}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <div>{isLoading && <LoadingIndicator isLoading={true} text="Generowanie fiszek..." />}</div>

          <Button onClick={onGenerateClick} disabled={isGenerateDisabled} className="min-w-[150px]">
            Generuj fiszki
          </Button>
        </div>
      </div>

      {apiError && <ErrorMessage error={apiError} showRetry={true} onRetry={onRetryGenerate} />}
    </div>
  );
}
