import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CollectionSelector } from "./CollectionSelector";

interface SourceTextInputProps {
  sourceText: string;
  onSourceTextChange: (text: string) => void;
  selectedCollection: string;
  onCollectionChange: (collection: string) => void;
  onGenerate: () => void;
  error: string | null;
  isLoading?: boolean;
}

export const SourceTextInput = ({
  sourceText,
  onSourceTextChange,
  selectedCollection,
  onCollectionChange,
  onGenerate,
  error,
  isLoading = false,
}: SourceTextInputProps) => {
  const [textError, setTextError] = useState<string | null>(null);

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value;
    onSourceTextChange(text);

    // Validate text length
    if (text.length > 0 && text.length < 100) {
      setTextError("Text must be at least 100 characters long");
    } else if (text.length > 10000) {
      setTextError("Text must be less than 10,000 characters");
    } else {
      setTextError(null);
    }
  };

  const isValid = sourceText.length >= 100 && sourceText.length <= 10000 && selectedCollection !== "";

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold">Enter Text Source</h2>
        <p className="text-sm text-muted-foreground">
          Paste your text below. The AI will generate flashcards based on this content.
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Textarea
            placeholder="Paste or type your text here (minimum 100 characters)"
            className="min-h-[200px] resize-y"
            value={sourceText}
            onChange={handleTextChange}
            disabled={isLoading}
          />

          <div className="flex justify-between text-sm">
            <span className={`${textError ? "text-destructive" : "text-muted-foreground"}`}>
              {textError || `${sourceText.length} / 10000 characters`}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Select Collection</p>
          <CollectionSelector
            selectedCollection={selectedCollection}
            onCollectionChange={onCollectionChange}
            disabled={isLoading}
          />
        </div>

        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
      </CardContent>

      <CardFooter>
        <Button onClick={onGenerate} disabled={!isValid || isLoading} className="w-full" size="lg">
          {isLoading ? "Generating..." : "Generate Flashcards"}
        </Button>
      </CardFooter>
    </Card>
  );
};
