import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";

interface GenerationProgressProps {
  progress: number;
  generatedCount: number;
  onCancel: () => void;
}

export const GenerationProgress = ({ progress, generatedCount, onCancel }: GenerationProgressProps) => {
  // Format progress to one decimal place
  const formattedProgress = Math.min(100, Math.max(0, Math.round(progress * 10) / 10));

  return (
    <Card className="w-full">
      <CardHeader className="pb-2">
        <h2 className="text-xl font-semibold">Generating Flashcards</h2>
        <p className="text-sm text-muted-foreground">Please wait while we analyze your text and generate flashcards</p>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Progress</span>
            <span className="text-sm text-muted-foreground">{formattedProgress}%</span>
          </div>
          <Progress value={formattedProgress} className="h-2" />
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Generation Stats</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Flashcards Generated</div>
              <div className="mt-1 text-2xl font-bold">{generatedCount}</div>
            </div>
            <div className="rounded-lg border p-3">
              <div className="text-sm font-medium text-muted-foreground">Estimated Time Left</div>
              <div className="mt-1 text-2xl font-bold">
                {formattedProgress < 100 ? `${Math.ceil((100 - formattedProgress) / 10)} sec` : "Complete"}
              </div>
            </div>
          </div>
        </div>
      </CardContent>

      <CardFooter>
        <Button variant="outline" onClick={onCancel} className="w-full">
          Cancel Generation
        </Button>
      </CardFooter>
    </Card>
  );
};
