"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface StringListInputProps {
  values: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
  addLabel?: string;
  disabled?: boolean;
  emptyHint?: string;
}

/**
 * Simple chip-style editor for managing an array of strings.
 * Items are deduplicated by their normalized (trimmed) value.
 */
export function StringListInput({
  values,
  onChange,
  placeholder,
  addLabel = "Hinzufügen",
  disabled = false,
  emptyHint,
}: StringListInputProps) {
  const [draft, setDraft] = useState("");

  function addValue() {
    const value = draft.trim();
    if (!value || values.includes(value)) {
      setDraft("");
      return;
    }
    onChange([...values, value]);
    setDraft("");
  }

  function removeValue(index: number) {
    onChange(values.filter((_, i) => i !== index));
  }

  return (
    <div className="grid gap-2">
      <div className="flex gap-2">
        <Input
          value={draft}
          placeholder={placeholder}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              addValue();
            }
          }}
          disabled={disabled}
        />
        <Button type="button" variant="secondary" onClick={addValue} disabled={disabled || draft.trim().length === 0}>
          {addLabel}
        </Button>
      </div>
      {values.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {values.map((item, index) => (
            <Badge key={item} variant="secondary" className="flex items-center gap-1">
              <span>{item}</span>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-sm border border-input bg-background text-xs"
                onClick={() => removeValue(index)}
                aria-label={`Entfernen ${item}`}
                disabled={disabled}
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      ) : (
        emptyHint ? <p className="text-xs text-muted-foreground">{emptyHint}</p> : null
      )}
    </div>
  );
}
