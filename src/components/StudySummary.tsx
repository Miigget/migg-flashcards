import { Button } from "./ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "./ui/card";
import type { StudySummaryData } from "@/types";

interface StudySummaryProps {
  summary: StudySummaryData;
  onStudyAgain: () => void;
  onGoToCollection: (collectionName: string) => void;
}

export default function StudySummary({ summary, onStudyAgain, onGoToCollection }: StudySummaryProps) {
  const { collectionName, cardsReviewed, againCount, hardCount, goodCount, easyCount } = summary;

  // Calculate percentages for the progress bars
  const calculatePercentage = (count: number) => (count / cardsReviewed) * 100;

  const againPercentage = calculatePercentage(againCount || 0);
  const hardPercentage = calculatePercentage(hardCount || 0);
  const goodPercentage = calculatePercentage(goodCount || 0);
  const easyPercentage = calculatePercentage(easyCount || 0);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <Card className="shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Session Complete!</CardTitle>
          <CardDescription>
            You reviewed {cardsReviewed} cards from <span className="font-medium">{collectionName}</span>
          </CardDescription>
        </CardHeader>

        <CardContent>
          <div className="space-y-6">
            <div className="text-center mb-8">
              <div className="text-4xl font-bold">{cardsReviewed}</div>
              <div className="text-sm text-gray-500">Cards Reviewed</div>
            </div>

            <h3 className="font-semibold mb-3">Performance Breakdown</h3>

            <div className="space-y-4">
              {againCount ? (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-red-600">Again</span>
                    <span className="text-sm text-gray-600">
                      {againCount} ({Math.round(againPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-red-500 h-2 rounded-full" style={{ width: `${againPercentage}%` }}></div>
                  </div>
                </div>
              ) : null}

              {hardCount ? (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-orange-600">Hard</span>
                    <span className="text-sm text-gray-600">
                      {hardCount} ({Math.round(hardPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: `${hardPercentage}%` }}></div>
                  </div>
                </div>
              ) : null}

              {goodCount ? (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-green-600">Good</span>
                    <span className="text-sm text-gray-600">
                      {goodCount} ({Math.round(goodPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${goodPercentage}%` }}></div>
                  </div>
                </div>
              ) : null}

              {easyCount ? (
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium text-blue-600">Easy</span>
                    <span className="text-sm text-gray-600">
                      {easyCount} ({Math.round(easyPercentage)}%)
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${easyPercentage}%` }}></div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </CardContent>

        <CardFooter className="flex justify-between gap-4">
          <Button variant="outline" className="flex-1" onClick={() => onGoToCollection(collectionName)}>
            Back to Collection
          </Button>
          <Button className="flex-1" onClick={onStudyAgain}>
            Study Again
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
