import { Rating } from "ts-fsrs";
import { Button } from "./ui/button";
import { cn } from "@/lib/utils";

interface RatingControlsProps {
  onRate: (rating: Rating) => void;
  disabled: boolean;
}

// Create a custom button style to override default button padding
const ratingButtonStyle = "py-4 px-1 min-h-[90px] border-2 border-gray-200 flex flex-col items-center justify-center";

export default function RatingControls({ onRate, disabled }: RatingControlsProps) {
  return (
    <div className="flex flex-wrap justify-center gap-3 w-full">
      <Button
        variant="outline"
        size="lg"
        className={cn(
          "flex-1 min-w-[90px]",
          ratingButtonStyle,
          "hover:bg-red-50 rounded-md shadow-sm transition-all hover:shadow"
        )}
        onClick={() => onRate(Rating.Again)}
        disabled={disabled}
        style={{ padding: "1rem 0.5rem" }} // Inline style to force overriding
      >
        <div className="flex flex-col items-center w-full">
          <span className="text-lg font-medium text-red-600 mb-1">Very Bad</span>
          <span className="text-xs text-gray-500">&lt;1d</span>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className={cn(
          "flex-1 min-w-[90px]",
          ratingButtonStyle,
          "hover:bg-orange-50 rounded-md shadow-sm transition-all hover:shadow"
        )}
        onClick={() => onRate(Rating.Hard)}
        disabled={disabled}
        style={{ padding: "1rem 0.5rem" }}
      >
        <div className="flex flex-col items-center w-full">
          <span className="text-lg font-medium text-orange-600 mb-1">Bad</span>
          <span className="text-xs text-gray-500">&lt;3d</span>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className={cn(
          "flex-1 min-w-[90px]",
          ratingButtonStyle,
          "hover:bg-yellow-50 rounded-md shadow-sm transition-all hover:shadow"
        )}
        onClick={() => onRate(Rating.Good)}
        disabled={disabled}
        style={{ padding: "1rem 0.5rem" }}
      >
        <div className="flex flex-col items-center w-full">
          <span className="text-lg font-medium text-yellow-600 mb-1">Good</span>
          <span className="text-xs text-gray-500">&lt;7d</span>
        </div>
      </Button>

      <Button
        variant="outline"
        size="lg"
        className={cn(
          "flex-1 min-w-[90px]",
          ratingButtonStyle,
          "hover:bg-green-50 rounded-md shadow-sm transition-all hover:shadow"
        )}
        onClick={() => onRate(Rating.Easy)}
        disabled={disabled}
        style={{ padding: "1rem 0.5rem" }}
      >
        <div className="flex flex-col items-center w-full">
          <span className="text-lg font-medium text-green-600 mb-1">Easy</span>
          <span className="text-xs text-gray-500">&lt;14d</span>
        </div>
      </Button>
    </div>
  );
}
