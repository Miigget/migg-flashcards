import { useState, useEffect } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Collection {
  id: string;
  name: string;
}

interface CollectionSelectorProps {
  selectedCollection: string;
  onCollectionChange: (collection: string) => void;
  disabled?: boolean;
}

export const CollectionSelector = ({
  selectedCollection,
  onCollectionChange,
  disabled = false,
}: CollectionSelectorProps) => {
  const [collections, setCollections] = useState<Collection[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Fetch collections on component mount
  useEffect(() => {
    const fetchCollections = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/api/collections");
        if (!response.ok) {
          throw new Error("Failed to fetch collections");
        }
        const data = await response.json();
        setCollections(data);

        // Select first collection if none selected and collections exist
        if (!selectedCollection && data.length > 0) {
          onCollectionChange(data[0].name);
        }
      } catch (err) {
        console.error("Error fetching collections:", err);
        setError("Failed to load collections");
      } finally {
        setIsLoading(false);
      }
    };

    fetchCollections();
  }, [selectedCollection, onCollectionChange]);

  const handleCreateCollection = async () => {
    if (!newCollectionName.trim()) {
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newCollectionName }),
      });

      if (!response.ok) {
        throw new Error("Failed to create collection");
      }

      const newCollection = await response.json();

      // Add new collection to the list and select it
      setCollections((prev) => [...prev, newCollection]);
      onCollectionChange(newCollection.name);
      setIsCreateDialogOpen(false);
      setNewCollectionName("");
    } catch (err) {
      console.error("Error creating collection:", err);
      setError("Failed to create collection");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="flex gap-2">
        <Select
          value={selectedCollection}
          onValueChange={onCollectionChange}
          disabled={disabled || isLoading || collections.length === 0}
        >
          <SelectTrigger className="flex-1">
            <SelectValue placeholder="Select a collection" />
          </SelectTrigger>
          <SelectContent>
            {collections.map((collection) => (
              <SelectItem key={collection.id} value={collection.name}>
                {collection.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          onClick={() => setIsCreateDialogOpen(true)}
          disabled={disabled || isLoading}
          type="button"
        >
          Create New
        </Button>
      </div>

      {error && <p className="text-sm text-destructive mt-1">{error}</p>}

      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Collection</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Collection Name</Label>
              <Input
                id="collection-name"
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                placeholder="Enter collection name"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateCollection} disabled={!newCollectionName.trim() || isLoading}>
              Create
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
