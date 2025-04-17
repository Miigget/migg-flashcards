import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { CandidateStatus, ReviewableCandidateViewModel } from "./types";

interface CandidateCardProps {
  candidate: ReviewableCandidateViewModel;
  onStatusChange: (id: string, status: CandidateStatus) => void;
  onEdit: (id: string) => void;
  isLoading?: boolean;
}

export const CandidateCard = ({ candidate, onStatusChange, onEdit, isLoading = false }: CandidateCardProps) => {
  const getStatusBadge = () => {
    switch (candidate.status) {
      case "accepted":
        return (
          <Badge variant="default" className="bg-green-600">
            Accepted
          </Badge>
        );
      case "edited":
        return (
          <Badge variant="default" className="bg-blue-600">
            Edited
          </Badge>
        );
      case "discarded":
        return (
          <Badge variant="outline" className="text-muted-foreground">
            Discarded
          </Badge>
        );
      default:
        return <Badge variant="outline">Pending</Badge>;
    }
  };

  const isEdited =
    candidate.status === "edited" &&
    (candidate.originalFront !== candidate.front || candidate.originalBack !== candidate.back);

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 ${candidate.status === "discarded" ? "opacity-60" : ""}`}
    >
      <CardContent className="p-0">
        <div className="grid grid-cols-1 divide-y">
          {/* Front Side */}
          <div className="p-4 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="text-sm font-medium text-muted-foreground">Front</h3>
              {getStatusBadge()}
            </div>
            <p className="text-base">
              {candidate.front}
              {isEdited && candidate.originalFront !== candidate.front && (
                <span className="block text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Original:</span> {candidate.originalFront}
                </span>
              )}
            </p>
          </div>

          {/* Back Side */}
          <div className="p-4 space-y-2 bg-muted/50">
            <h3 className="text-sm font-medium text-muted-foreground">Back</h3>
            <p className="text-base">
              {candidate.back}
              {isEdited && candidate.originalBack !== candidate.back && (
                <span className="block text-xs text-muted-foreground mt-2">
                  <span className="font-medium">Original:</span> {candidate.originalBack}
                </span>
              )}
            </p>
          </div>
        </div>
      </CardContent>

      <CardFooter className="p-3 bg-muted/30 border-t flex justify-between gap-2">
        {candidate.status === "pending" || candidate.status === "discarded" ? (
          <Button
            size="sm"
            variant="default"
            className="flex-1"
            onClick={() => onStatusChange(candidate.id, "accepted")}
            disabled={isLoading}
          >
            Accept
          </Button>
        ) : (
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={() => onStatusChange(candidate.id, "discarded")}
            disabled={isLoading}
          >
            Discard
          </Button>
        )}

        <Button
          size="sm"
          variant="outline"
          className="flex-1"
          onClick={() => onEdit(candidate.id)}
          disabled={isLoading}
        >
          Edit
        </Button>
      </CardFooter>
    </Card>
  );
};
