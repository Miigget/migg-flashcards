import { Rating } from "ts-fsrs";
import { Button } from "./ui/button";

interface RatingControlsProps {
  onRate: (rating: Rating) => void;
  disabled: boolean;
}

export default function RatingControls({ onRate, disabled }: RatingControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 w-full">
      <Button
        variant="outline"
        size="lg"
        className="flex-1 min-w-[100px] py-4 border-2 border-red-300 text-red-600 hover:bg-red-50 rounded-md shadow-sm transition-all hover:shadow"
        onClick={() => onRate(Rating.Again)}
        disabled={disabled}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium">Again</span>
          <span className="text-xs text-gray-500 mt-1">&lt; 1d</span>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="flex-1 min-w-[100px] py-4 border-2 border-orange-300 text-orange-600 hover:bg-orange-50 rounded-md shadow-sm transition-all hover:shadow"
        onClick={() => onRate(Rating.Hard)}
        disabled={disabled}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium">Hard</span>
          <span className="text-xs text-gray-500 mt-1">~3d</span>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="flex-1 min-w-[100px] py-4 border-2 border-green-300 text-green-600 hover:bg-green-50 rounded-md shadow-sm transition-all hover:shadow"
        onClick={() => onRate(Rating.Good)}
        disabled={disabled}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium">Good</span>
          <span className="text-xs text-gray-500 mt-1">~7d</span>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className="flex-1 min-w-[100px] py-4 border-2 border-blue-300 text-blue-600 hover:bg-blue-50 rounded-md shadow-sm transition-all hover:shadow"
        onClick={() => onRate(Rating.Easy)}
        disabled={disabled}
      >
        <div className="flex flex-col items-center">
          <span className="text-lg font-medium">Easy</span>
          <span className="text-xs text-gray-500 mt-1">~14d</span>
        </div>
      </Button>
    </div>
  );
}
