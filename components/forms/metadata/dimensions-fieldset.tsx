"use client";

import type { DimensionsCm } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface DimensionsFieldsetProps {
  value: DimensionsCm | undefined;
  onChange: (next: DimensionsCm | undefined) => void;
  disabled?: boolean;
}

export function DimensionsFieldset({ value, onChange, disabled = false }: DimensionsFieldsetProps) {
  function parseNumber(raw: string): number | undefined {
    if (raw.trim() === "") return undefined;
    const parsed = Number(raw.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  function handleBaseChange(key: "width" | "height", raw: string) {
    const parsed = parseNumber(raw);
    if (parsed === undefined) {
      onChange(undefined);
      return;
    }
    const current = value ?? { width: parsed, height: parsed };
    const next: DimensionsCm = {
      ...current,
      [key]: parsed,
    } as DimensionsCm;
    onChange(next);
  }

  function handleDepthChange(raw: string) {
    const parsed = parseNumber(raw);
    if (!value) {
      if (parsed === undefined) return;
      // Require width/height before depth; ignore isolated depth inputs.
      return;
    }
    if (parsed === undefined) {
      const { width, height } = value;
      onChange({ width, height });
      return;
    }
    onChange({ ...value, depth: parsed });
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      <div className="grid gap-1.5">
        <Label htmlFor="dimensions-width">Breite (cm)</Label>
        <Input
          id="dimensions-width"
          type="number"
          min={0}
          step="0.1"
          value={value?.width ?? ""}
          onChange={(event) => handleBaseChange("width", event.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="dimensions-height">Höhe (cm)</Label>
        <Input
          id="dimensions-height"
          type="number"
          min={0}
          step="0.1"
          value={value?.height ?? ""}
          onChange={(event) => handleBaseChange("height", event.target.value)}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="dimensions-depth">Tiefe (cm)</Label>
        <Input
          id="dimensions-depth"
          type="number"
          min={0}
          step="0.1"
          value={value?.depth ?? ""}
          onChange={(event) => handleDepthChange(event.target.value)}
          disabled={disabled}
        />
      </div>
    </div>
  );
}
