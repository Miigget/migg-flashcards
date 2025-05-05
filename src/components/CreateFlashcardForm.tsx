import React, { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type SubmitHandler, type ControllerRenderProps } from "react-hook-form";
import { z } from "zod";
import { toast } from "sonner";
import { Check, ChevronsUpDown } from "lucide-react"; // Icons for Combobox

import { cn } from "@/lib/utils"; // Utility for classnames, assuming it exists
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"; // Command for Combobox
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"; // Popover for Combobox
import type { ApiError, CreateFlashcardCommand } from "@/types";
import { useCreateFlashcard } from "@/components/hooks/useCreateFlashcard";

// Define Zod schema based on implementation plan validation rules
const CreateFlashcardFormSchema = z.object({
  front: z.string().min(1, "Field 'Front' is required.").max(200, "Field 'Front' cannot exceed 200 characters."),
  back: z.string().min(1, "Field 'Back' is required.").max(500, "Field 'Back' cannot exceed 500 characters."),
  collection: z.string().min(1, "You must select or create a collection."),
});

// Infer the TypeScript type from the Zod schema
type CreateFlashcardFormData = z.infer<typeof CreateFlashcardFormSchema>;

interface CreateFlashcardFormProps {
  collections: string[];
  fetchError: ApiError | null; // To display error fetching collections
  initialCollection?: string | null; // Add optional initialCollection prop
}

const CreateFlashcardForm: React.FC<CreateFlashcardFormProps> = ({ collections, fetchError, initialCollection }) => {
  // Initialize react-hook-form
  const form = useForm<CreateFlashcardFormData>({
    resolver: zodResolver(CreateFlashcardFormSchema),
    defaultValues: {
      front: "",
      back: "",
      collection: initialCollection || "", // Use initialCollection if provided
    },
    mode: "onChange", // Validate on change for immediate feedback
  });

  // Watch field values for character counters
  const frontValue = form.watch("front");
  const backValue = form.watch("back");
  const frontLength = frontValue?.length || 0;
  const backLength = backValue?.length || 0;
  const maxFrontLength = 200;
  const maxBackLength = 500;

  // Use the custom hook for API state and actions
  const { createFlashcard, isSubmitting, error: submitError } = useCreateFlashcard();

  // State for controlling the cancel confirmation dialog
  const [isCancelDialogOpen, setIsCancelDialogOpen] = useState(false);

  // State for Combobox open state
  const [isComboboxOpen, setIsComboboxOpen] = useState(false);

  // State for redirection
  const [redirectUrl, setRedirectUrl] = useState<string | null>(null);

  // Effect to handle redirection
  useEffect(() => {
    if (redirectUrl) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl]);

  // Handle form submission
  const onSubmit: SubmitHandler<CreateFlashcardFormData> = async (data) => {
    // Trim collection name before submitting
    const command: CreateFlashcardCommand = {
      ...data,
      collection: data.collection.trim(),
      source: "manual",
    };
    // eslint-disable-next-line no-console
    console.log("Submitting command:", command);

    try {
      const createdFlashcard = await createFlashcard(command);
      toast.success("Flashcard Created!", {
        description: `Flashcard added to collection '${createdFlashcard.collection}'.`,
      });
      form.reset({ front: "", back: "", collection: command.collection }); // Reset but keep collection selected
      // Trigger redirection using state
      setRedirectUrl(`/collections/${createdFlashcard.collection}`);
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("Form Submission Error:", error);
      const message =
        submitError?.message ||
        (error instanceof Error ? error.message : "Failed to create flashcard. Please try again.");
      toast.error("Submission Failed", {
        description: message,
      });
    }
  };

  // Function to actually perform the back navigation
  const confirmCancel = () => {
    window.history.back();
  };

  // Display error if collections failed to load
  if (fetchError) {
    return (
      <p className="text-destructive">Error loading collection data: {fetchError.message}. Cannot create flashcard.</p>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Front Field */}
        <FormField
          control={form.control}
          name="front"
          render={({ field }: { field: ControllerRenderProps<CreateFlashcardFormData, "front"> }) => (
            <FormItem>
              <FormLabel>Front</FormLabel>
              <FormControl>
                <Input placeholder="Enter the front text (question/term)" {...field} />
              </FormControl>
              <div className="flex justify-between text-sm">
                <FormDescription>The question or term for the flashcard.</FormDescription>
                <span
                  className={`char-counter ${frontLength > maxFrontLength ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {frontLength}/{maxFrontLength}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Back Field */}
        <FormField
          control={form.control}
          name="back"
          render={({ field }: { field: ControllerRenderProps<CreateFlashcardFormData, "back"> }) => (
            <FormItem>
              <FormLabel>Back</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Enter the back text (answer/definition)"
                  rows={4}
                  className="resize-y" // Allow vertical resize
                  {...field}
                />
              </FormControl>
              <div className="flex justify-between text-sm">
                <FormDescription>The answer or definition for the flashcard.</FormDescription>
                <span
                  className={`char-counter ${backLength > maxBackLength ? "text-destructive" : "text-muted-foreground"}`}
                >
                  {backLength}/{maxBackLength}
                </span>
              </div>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Collection Field - Replaced Select with Combobox */}
        <FormField
          control={form.control}
          name="collection"
          render={({ field }: { field: ControllerRenderProps<CreateFlashcardFormData, "collection"> }) => (
            <FormItem className="flex flex-col">
              <FormLabel>Collection</FormLabel>
              <Popover open={isComboboxOpen} onOpenChange={setIsComboboxOpen}>
                <PopoverTrigger asChild>
                  <FormControl>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={isComboboxOpen}
                      className={cn("w-full justify-between", !field.value && "text-muted-foreground")}
                    >
                      {field.value
                        ? collections.find((col) => col === field.value) || `Create "${field.value}"`
                        : "Select or create collection..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                  <Command shouldFilter={false}>
                    {" "}
                    {/* Disable default filtering, allow custom input */}
                    <CommandInput
                      placeholder="Search or type new collection..."
                      value={field.value}
                      onValueChange={(search) => {
                        // Directly update the form field value as user types
                        field.onChange(search);
                        // Keep the popover open while typing
                        if (!isComboboxOpen) setIsComboboxOpen(true);
                      }}
                    />
                    <CommandList>
                      <CommandEmpty>No existing collection found. Type to create new.</CommandEmpty>
                      <CommandGroup heading="Existing Collections">
                        {collections.map((col) => (
                          <CommandItem
                            key={col}
                            value={col} // value is used for selection matching
                            onSelect={() => {
                              form.setValue("collection", col, { shouldValidate: true });
                              setIsComboboxOpen(false);
                            }}
                          >
                            <Check className={cn("mr-2 h-4 w-4", field.value === col ? "opacity-100" : "opacity-0")} />
                            {col}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                      {/* Optionally, add a suggestion to create the typed value if it doesn't exist */}
                      {field.value && !collections.includes(field.value.trim()) && (
                        <CommandGroup heading="Create New">
                          <CommandItem
                            value={field.value.trim()} // Use trimmed value
                            onSelect={() => {
                              form.setValue("collection", field.value.trim(), { shouldValidate: true });
                              setIsComboboxOpen(false);
                            }}
                          >
                            <Check className="mr-2 h-4 w-4 opacity-0" /> {/* No checkmark initially */}
                            Create &quot;{field.value.trim()}&quot;
                          </CommandItem>
                        </CommandGroup>
                      )}
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
              <FormDescription>Choose an existing collection or type a new name to create one.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pt-4">
          {/* Cancel Button triggers the AlertDialog */}
          <AlertDialog open={isCancelDialogOpen} onOpenChange={setIsCancelDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button type="button" variant="outline" disabled={isSubmitting}>
                Cancel
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure you want to cancel?</AlertDialogTitle>
                <AlertDialogDescription>
                  Any unsaved changes made to this flashcard will be lost.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep Editing</AlertDialogCancel>
                <AlertDialogAction onClick={confirmCancel}>Discard Changes</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <Button type="submit" disabled={isSubmitting || !form.formState.isValid}>
            {isSubmitting ? "Saving..." : "Save Flashcard"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default CreateFlashcardForm;
