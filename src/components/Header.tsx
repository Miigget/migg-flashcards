import { Button } from "./ui/button";
import { Progress } from "./ui/progress";

interface HeaderProps {
  collectionName: string;
  currentCardIndex: number;
  totalCardsInSession: number;
  onEndSession: () => void;
}

export default function Header({ collectionName, currentCardIndex, totalCardsInSession, onEndSession }: HeaderProps) {
  const progressPercentage = (currentCardIndex / totalCardsInSession) * 100;

  return (
    <div className="w-full max-w-2xl mb-8">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">{collectionName}</h1>
        <Button variant="outline" size="sm" onClick={onEndSession}>
          End Session
        </Button>
      </div>

      <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
        <span>
          Card {currentCardIndex} of {totalCardsInSession}
        </span>
        <span>{Math.round(progressPercentage)}% Complete</span>
      </div>

      <Progress value={progressPercentage} className="h-2 w-full" />
    </div>
  );
}
