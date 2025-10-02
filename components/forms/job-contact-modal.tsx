"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SearchPicker, type SearchItem } from "@/components/search/search-picker";
import { ContactFormDialog } from "@/components/forms/contacts/contact-form-dialog";
import { useRouter } from "next/navigation";

type Contact = Tables<"contacts">;

interface JobContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  jobId: number;
  companyId: number;
  currentContactId: number | null;
}

export function JobContactModal({ open, onOpenChange, jobId, companyId, currentContactId }: JobContactModalProps) {
  const supabase = useMemo(() => createClient(), []);
  const router = useRouter();
  const [contactId, setContactId] = useState<number | "">(currentContactId ?? "");
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [contactDialogOpen, setContactDialogOpen] = useState(false);

  const contactItems = useMemo(() => {
    return contacts
      .filter((contact) => contact.contact_type === "customer")
      .map((contact): SearchItem<"contact", Contact> => {
        const displayName = contact.display_name || contact.company_name || `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim() || `#${contact.id}`;
        const matchers = [
          { value: String(contact.id), weight: 5 },
          contact.display_name && { value: contact.display_name, weight: 20 },
          contact.company_name && { value: contact.company_name, weight: 20 },
          contact.first_name && { value: contact.first_name, weight: 15 },
          contact.last_name && { value: contact.last_name, weight: 15 },
        ].filter(Boolean) as Array<{ value: string; weight: number }>;

        return {
          id: `contact-${contact.id}`,
          category: "contact",
          title: displayName,
          description: `Kontakt #${contact.id}`,
          meta: contact.contact_type,
          priority: 0,
          matchers,
          data: contact,
        };
      });
  }, [contacts]);

  useEffect(() => {
    if (!open) return;
    let active = true;
    async function loadContacts() {
      const { data, error } = await supabase
        .from("contacts")
        .select("*")
        .eq("company_id", companyId)
        .order("display_name", { ascending: true });
      if (!active) return;
      if (error) {
        console.error("Failed to load contacts", error);
        return;
      }
      setContacts((data as Contact[]) ?? []);
    }
    loadContacts();
    return () => {
      active = false;
    };
  }, [supabase, companyId, open]);

  const handleSave = async () => {
    setError(null);
    setSaving(true);

    try {
      const { error: updateError } = await supabase
        .from("jobs")
        .update({ contact_id: contactId === "" ? null : Number(contactId) })
        .eq("id", jobId);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      router.refresh();
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unbekannter Fehler");
    } finally {
      setSaving(false);
    }
  };

  const handleContactCreated = async (newContact: Contact) => {
    setContactDialogOpen(false);
    setContactId(newContact.id);
    // Reload contacts to include the new one
    const { data } = await supabase
      .from("contacts")
      .select("*")
      .eq("company_id", companyId)
      .order("display_name", { ascending: true });
    if (data) {
      setContacts(data as Contact[]);
    }
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Kontakt ändern</DialogTitle>
            <DialogDescription>Wähle einen neuen Auftraggeber für diesen Job</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="contact_id">Kontakt</Label>
              <SearchPicker
                items={contactItems}
                onSelect={(item) => setContactId(item.data.id)}
                categoryLabels={{ contact: "Kontakte" }}
                placeholder="Kontakt suchen..."
                emptyLabel="Keine Kontakte gefunden"
                buttonLabel={
                  contactId
                    ? contacts.find((c) => c.id === contactId)?.display_name ||
                      contacts.find((c) => c.id === contactId)?.company_name ||
                      `Kontakt #${contactId}`
                    : "Kontakt auswählen"
                }
                resetOnSelect={false}
              />
            </div>
            <Button type="button" variant="secondary" onClick={() => setContactDialogOpen(true)}>
              Neuen Kontakt anlegen
            </Button>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Abbrechen
            </Button>
            <Button type="button" onClick={handleSave} disabled={saving}>
              {saving ? "Speichern..." : "Speichern"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <ContactFormDialog
        open={contactDialogOpen}
        onOpenChange={setContactDialogOpen}
        companyId={companyId}
        onCreated={handleContactCreated}
      />
    </>
  );
}
