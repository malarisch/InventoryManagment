"use client";

import type { Price } from "@/components/metadataTypes.types";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface PriceFieldsProps {
  value: Price | undefined;
  onChange: (next: Price | undefined) => void;
  disabled?: boolean;
  currencyFallback?: string;
}

function ensurePrice(current: Price | undefined, currencyFallback: string): Price {
  if (current) return current;
  return {
    amount: 0,
    grossNet: "net",
    currency: currencyFallback,
    taxRate: 0,
  };
}

export function PriceFields({ value, onChange, disabled = false, currencyFallback = "EUR" }: PriceFieldsProps) {
  const hasAmount = value?.amount !== undefined;

  function parseNumber(raw: string): number | undefined {
    if (raw.trim() === "") return undefined;
    const parsed = Number(raw.replace(",", "."));
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <div className="grid gap-1.5">
        <Label htmlFor="price-amount">Betrag</Label>
        <Input
          id="price-amount"
          type="number"
          min={0}
          step="0.01"
          // Price.amount is stored in smallest unit (e.g., cents). Display in main unit.
          value={value?.amount !== undefined ? value.amount / 100 : ""}
          onChange={(event) => {
            const parsed = parseNumber(event.target.value);
            if (parsed === undefined) {
              onChange(undefined);
              return;
            }
            const next = ensurePrice(value, currencyFallback);
            // Persist in smallest unit (cents)
            onChange({ ...next, amount: Math.round(parsed * 100) });
          }}
          disabled={disabled}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="price-currency">Währung</Label>
        <Input
          id="price-currency"
          value={value?.currency ?? currencyFallback}
          onChange={(event) => {
            const next = ensurePrice(value, currencyFallback);
            onChange({ ...next, currency: event.target.value.toUpperCase() });
          }}
          maxLength={3}
          disabled={disabled || !hasAmount}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="price-grossnet">Preisart</Label>
        <select
          id="price-grossnet"
          className="h-9 rounded-md border bg-background px-3 text-sm"
          value={value?.grossNet ?? "net"}
          onChange={(event) => {
            const next = ensurePrice(value, currencyFallback);
            onChange({ ...next, grossNet: event.target.value as Price["grossNet"] });
          }}
          disabled={disabled || !hasAmount}
        >
          <option value="net">Netto</option>
          <option value="gross">Brutto</option>
        </select>
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="price-tax">Steuersatz (%)</Label>
        <Input
          id="price-tax"
          type="number"
          min={0}
          step="0.1"
          value={value?.taxRate ?? ""}
          onChange={(event) => {
            const parsed = parseNumber(event.target.value);
            if (parsed === undefined) {
              if (!value) return;
              onChange({ ...value, taxRate: 0 });
              return;
            }
            const next = ensurePrice(value, currencyFallback);
            onChange({ ...next, taxRate: parsed });
          }}
          disabled={disabled || !hasAmount}
        />
      </div>
      <div className="grid gap-1.5">
        <Label htmlFor="price-discount">Rabatt (%)</Label>
        <Input
          id="price-discount"
          type="number"
          min={0}
          step="0.1"
          value={value?.discount ?? ""}
          onChange={(event) => {
            const parsed = parseNumber(event.target.value);
            if (parsed === undefined) {
              if (!value) return;
              const next = { ...value };
              delete next.discount;
              onChange(next);
              return;
            }
            const next = ensurePrice(value, currencyFallback);
            onChange({ ...next, discount: parsed });
          }}
          disabled={disabled || !hasAmount}
        />
      </div>
    </div>
  );
}
