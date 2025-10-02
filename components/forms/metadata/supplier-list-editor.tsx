"use client";

import type { SupplierReference, ContactInfo } from "@/components/metadataTypes.types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { PriceFields } from "@/components/forms/metadata/price-fields";
import { Textarea } from "@/components/ui/textarea";
import { PlusCircle, Trash2 } from "lucide-react";

export interface ContactOption {
  id: number;
  label: string;
  snapshot?: ContactInfo;
}

interface SupplierListEditorProps {
  suppliers: SupplierReference[];
  onChange: (next: SupplierReference[]) => void;
  contactOptions?: ContactOption[];
  onCreateContact?: () => void;
  disabled?: boolean;
  currencyFallback?: string;
}

export function SupplierListEditor({
  suppliers,
  onChange,
  contactOptions,
  onCreateContact,
  disabled = false,
  currencyFallback,
}: SupplierListEditorProps) {
  function updateSupplier(index: number, partial: Partial<SupplierReference>) {
    const next = suppliers.map((item, i) => (i === index ? { ...item, ...partial } : item));
    onChange(next);
  }

  function removeSupplier(index: number) {
    onChange(suppliers.filter((_, i) => i !== index));
  }

  function addSupplier() {
    onChange([
      ...suppliers,
      {
        displayName: "",
        isPreferred: suppliers.length === 0,
      },
    ]);
  }

  return (
    <div className="grid gap-4">
      {suppliers.map((supplier, index) => (
        <div key={index} className="rounded-md border p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 grid gap-1.5">
              <Label htmlFor={`supplier-contact-${index}`}>Kontakt</Label>
              {contactOptions && contactOptions.length > 0 ? (
                <select
                  id={`supplier-contact-${index}`}
                  className="h-9 rounded-md border bg-background px-3 text-sm"
                  value={supplier.contactId ?? ""}
                  onChange={(event) => {
                  const value = event.target.value === "" ? undefined : Number(event.target.value);
                  const option = contactOptions.find((opt) => opt.id === value);
                  updateSupplier(index, {
                    contactId: value,
                    displayName: option?.label,
                    contactSnapshot: option?.snapshot,
                  });
                }}
                disabled={disabled}
              >
                  <option value="">– Kein Kontakt verknüpft –</option>
                  {contactOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              ) : (
                <Input
                  id={`supplier-contact-${index}`}
                  value={supplier.displayName ?? ""}
                  placeholder="Name des Lieferanten"
                  onChange={(event) => updateSupplier(index, { displayName: event.target.value })}
                  disabled={disabled}
                />
              )}
              {onCreateContact ? (
                <button
                  type="button"
                  className="self-start text-xs text-muted-foreground underline underline-offset-2"
                  onClick={onCreateContact}
                  disabled={disabled}
                >
                  Neuen Kontakt anlegen
                </button>
              ) : null}
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeSupplier(index)}
              disabled={disabled}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mt-4 grid gap-3">
            <div className="flex items-center gap-2">
              <Checkbox
                id={`supplier-preferred-${index}`}
                checked={!!supplier.isPreferred}
                onCheckedChange={(checked) => updateSupplier(index, { isPreferred: !!checked })}
                disabled={disabled}
              />
              <Label htmlFor={`supplier-preferred-${index}`}>Bevorzugter Lieferant</Label>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor={`supplier-website-${index}`}>Website</Label>
              <Input
                id={`supplier-website-${index}`}
                value={supplier.website?.url ?? ""}
                placeholder="https://"
                onChange={(event) => {
                  const url = event.target.value.trim();
                  if (!url) {
                    const next = { ...supplier };
                    delete next.website;
                    updateSupplier(index, next);
                    return;
                  }
                  updateSupplier(index, { website: { url, description: supplier.website?.description } });
                }}
                disabled={disabled}
              />
            </div>

            <PriceFields
              value={supplier.price}
              onChange={(nextPrice) => updateSupplier(index, { price: nextPrice })}
              disabled={disabled}
              currencyFallback={currencyFallback}
            />

            <div className="grid gap-1.5">
              <Label htmlFor={`supplier-notes-${index}`}>Notizen</Label>
              <Textarea
                id={`supplier-notes-${index}`}
                value={supplier.notes ?? ""}
                onChange={(event) => updateSupplier(index, { notes: event.target.value })}
                disabled={disabled}
                rows={3}
              />
            </div>
          </div>
        </div>
      ))}

      <Button type="button" variant="outline" onClick={addSupplier} disabled={disabled} className="justify-start">
        <PlusCircle className="mr-2 h-4 w-4" /> Lieferant hinzufügen
      </Button>
    </div>
  );
}
