import React, { useState, useEffect } from "react";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "./command";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Button } from "./button";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "../../lib/utils";

interface CollectionSelectorProps {
  collections: string[];
  value: string;
  onChange: (value: string, isNew: boolean) => void;
  placeholder?: string;
  isLoading?: boolean;
  disabled?: boolean;
}

export default function CollectionSelector({
  collections,
  value,
  onChange,
  placeholder = "Wybierz kolekcję...",
  isLoading = false,
  disabled = false,
}: CollectionSelectorProps) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value);

  // Aktualizacja inputValue, gdy zmienia się value z zewnątrz
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Sprawdzenie, czy obecna wartość inputValue jest nowa (nie istnieje w kolekcjach)
  const isNewCollection = inputValue.trim() !== "" && !collections.includes(inputValue);

  // Obsługa zmiany w polu wejściowym
  const handleInputChange = (newValue: string) => {
    setInputValue(newValue);
  };

  // Obsługa wyboru z listy
  const handleSelect = (selectedValue: string) => {
    onChange(selectedValue, false);
    setOpen(false);
  };

  // Obsługa tworzenia nowej kolekcji
  const handleCreateNew = () => {
    if (inputValue.trim() !== "") {
      onChange(inputValue, true);
      setOpen(false);
    }
  };

  // Obsługa zatwierdzenia wartości wpisanej ręcznie
  const handleCommit = () => {
    if (inputValue.trim() !== "") {
      onChange(inputValue, isNewCollection);
      setOpen(false);
    }
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
          disabled={disabled || isLoading}
          onClick={() => setOpen(true)}
        >
          {value ? value : <span className="text-muted-foreground">{placeholder}</span>}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-full min-w-[300px]">
        <Command>
          <CommandInput
            placeholder="Szukaj lub utwórz nową kolekcję..."
            value={inputValue}
            onValueChange={handleInputChange}
            onKeyDown={(e: React.KeyboardEvent) => {
              if (e.key === "Enter") {
                handleCommit();
              }
            }}
          />
          <CommandList>
            <CommandEmpty>
              {inputValue.trim() === "" ? (
                <p className="py-3 px-2 text-sm text-muted-foreground text-center">
                  Brak dostępnych kolekcji. Wpisz nazwę, aby utworzyć nową.
                </p>
              ) : (
                <button
                  className="flex items-center gap-2 w-full py-3 px-2 text-sm hover:bg-accent rounded-sm"
                  onClick={handleCreateNew}
                >
                  <Plus className="h-4 w-4" />
                  <span>
                    Utwórz kolekcję &quot;<strong>{inputValue}</strong>&quot;
                  </span>
                </button>
              )}
            </CommandEmpty>
            <CommandGroup heading="Dostępne kolekcje">
              {collections.map((collection) => (
                <CommandItem
                  key={collection}
                  value={collection}
                  onSelect={handleSelect}
                  className="flex items-center gap-2"
                >
                  <Check className={cn("h-4 w-4", value === collection ? "opacity-100" : "opacity-0")} />
                  <span>{collection}</span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
