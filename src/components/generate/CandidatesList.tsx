import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CandidateCard } from "./CandidateCard";
import { EditCandidateModal } from "./EditCandidateModal";
import type { CandidateStatus, ReviewableCandidateViewModel } from "./types";

interface CandidatesListProps {
  candidates: ReviewableCandidateViewModel[];
  onCandidateStatusChange: (
    id: string,
    status: CandidateStatus,
    updatedData?: { front?: string; back?: string }
  ) => void;
  onBulkSave: () => void;
  selectedCollection: string;
  isLoading: boolean;
  error: string | null;
}

type FilterType = "all" | "accepted" | "edited" | "discarded" | "pending";

export const CandidatesList = ({
  candidates,
  onCandidateStatusChange,
  onBulkSave,
  selectedCollection,
  isLoading,
  error,
}: CandidatesListProps) => {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [editingCandidate, setEditingCandidate] = useState<ReviewableCandidateViewModel | null>(null);

  // Filter candidates based on active filter
  const filteredCandidates = candidates.filter((candidate) => {
    if (activeFilter === "all") return true;
    return candidate.status === activeFilter;
  });

  // Count candidates by status
  const countByStatus = {
    all: candidates.length,
    accepted: candidates.filter((c) => c.status === "accepted").length,
    edited: candidates.filter((c) => c.status === "edited").length,
    discarded: candidates.filter((c) => c.status === "discarded").length,
    pending: candidates.filter((c) => c.status === "pending").length,
  };

  // Handle editing a candidate
  const handleEdit = (id: string) => {
    const candidate = candidates.find((c) => c.id === id);
    if (candidate) {
      setEditingCandidate(candidate);
    }
  };

  // Handle saving edited candidate
  const handleSaveEdit = (id: string, front: string, back: string) => {
    onCandidateStatusChange(id, "edited", { front, back });
    setEditingCandidate(null);
  };

  // Check if we can save (have at least one accepted or edited card)
  const canSave = countByStatus.accepted > 0 || countByStatus.edited > 0;

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-2">
          <h2 className="text-xl font-semibold">Review Generated Flashcards</h2>
          <p className="text-sm text-muted-foreground">
            Review, edit, and select which flashcards to save to your collection.
          </p>
        </CardHeader>

        <CardContent>
          <Tabs defaultValue="all" onValueChange={(value) => setActiveFilter(value as FilterType)}>
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="all">All ({countByStatus.all})</TabsTrigger>
              <TabsTrigger value="accepted">Accepted ({countByStatus.accepted})</TabsTrigger>
              <TabsTrigger value="edited">Edited ({countByStatus.edited})</TabsTrigger>
              <TabsTrigger value="pending">Pending ({countByStatus.pending})</TabsTrigger>
              <TabsTrigger value="discarded">Discarded ({countByStatus.discarded})</TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderCandidates(filteredCandidates)}</div>
            </TabsContent>

            <TabsContent value="accepted" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderCandidates(filteredCandidates)}</div>
            </TabsContent>

            <TabsContent value="edited" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderCandidates(filteredCandidates)}</div>
            </TabsContent>

            <TabsContent value="pending" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderCandidates(filteredCandidates)}</div>
            </TabsContent>

            <TabsContent value="discarded" className="pt-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">{renderCandidates(filteredCandidates)}</div>
            </TabsContent>
          </Tabs>
        </CardContent>

        <CardFooter className="flex-col gap-4">
          {error && (
            <Alert variant="destructive" className="w-full">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="w-full flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {canSave
                ? `${countByStatus.accepted + countByStatus.edited} flashcards will be saved to "${selectedCollection}"`
                : "Select at least one flashcard to save"}
            </p>
            <Button onClick={onBulkSave} disabled={!canSave || isLoading} size="lg">
              {isLoading ? "Saving..." : "Save Flashcards"}
            </Button>
          </div>
        </CardFooter>
      </Card>

      {/* Edit Modal */}
      {editingCandidate && (
        <EditCandidateModal
          isOpen={!!editingCandidate}
          onClose={() => setEditingCandidate(null)}
          candidate={editingCandidate}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );

  // Helper function to render candidate cards
  function renderCandidates(candidates: ReviewableCandidateViewModel[]) {
    if (candidates.length === 0) {
      return <div className="col-span-full text-center py-8 text-muted-foreground">No flashcards in this category</div>;
    }

    return candidates.map((candidate) => (
      <CandidateCard
        key={candidate.id}
        candidate={candidate}
        onStatusChange={onCandidateStatusChange}
        onEdit={handleEdit}
        isLoading={isLoading}
      />
    ));
  }
};
