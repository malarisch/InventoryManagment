import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { ContactEditForm } from "@/components/forms/contact-edit-form";
import { HistoryCard } from "@/components/historyCard";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";
import { FileManager } from "@/components/files/file-manager";

type Contact = Tables<"contacts">;

function displayName(contact: Contact): string {
  const company = contact.company_name?.trim();
  if (company) return company;
  const full = `${contact.forename ?? contact.first_name ?? ""} ${contact.surname ?? contact.last_name ?? ""}`.trim();
  return full || contact.display_name || `#${contact.id}`;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("contacts")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center p-5">
        <div className="w-full max-w-none flex-1">
          <p className="text-red-600">Eintrag nicht gefunden.</p>
        </div>
      </main>
    );
  }

  const contact = data as Contact;
  const creator = await fetchUserDisplayAdmin(contact.created_by ?? undefined);

  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, name, startdate, enddate")
    .eq("contact_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  const jobs = (jobsData as Array<{ id: number; name: string | null; startdate: string | null; enddate: string | null }> | null) ?? [];

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/contacts" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <section className="space-y-2">
          <h1 id="contact-title" className="text-2xl font-semibold tracking-tight">
            {displayName(contact)}
          </h1>
          <p className="text-sm text-muted-foreground">
            #{contact.id} {contact.customer_type ? `• ${contact.customer_type}` : ""}
            {contact.contact_type && contact.contact_type !== 'customer' ? ` (${contact.contact_type})` : ""}
          </p>
          <p className="text-sm text-muted-foreground">
            E-Mail: {contact.email ?? "—"} • Adresse: {contact.address ?? contact.street ?? "—"}
            {contact.postal_code ? `, ${contact.postal_code}` : contact.zip_code ? `, ${contact.zip_code}` : ""}
            {contact.country ? `, ${contact.country}` : ""}
          </p>
          <p className="text-xs text-muted-foreground">
            Erstellt am: {formatDateTime(safeParseDate(contact.created_at))}
            {` • Erstellt von: ${creator ?? (contact.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(contact.created_by)) ?? '—'}`}
          </p>

          <div className="mt-3">
            <DeleteWithUndo table="contacts" id={contact.id} payload={contact as Record<string, unknown>} redirectTo="/management/contacts" />
          </div>

          {/* Main edit form without extra Card wrapper */}
          <ContactEditForm contact={contact} />
        </section>

        <Card>
          <CardHeader>
            <CardTitle>Dateien</CardTitle>
            <CardDescription>Anhänge und Dokumente zu diesem Kontakt</CardDescription>
          </CardHeader>
          <CardContent>
            <FileManager table="contacts" rowId={contact.id} companyId={contact.company_id} isPublic={false} initial={(contact as Record<string, unknown>).files} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jobs dieses Kontakts</CardTitle>
            <CardDescription>{jobs.length} Einträge</CardDescription>
          </CardHeader>
          <CardContent>
            {jobs.length ? (
              <ul className="list-disc pl-5 text-sm">
                {jobs.map((j) => (
                  <li key={j.id}>
                    <Link className="underline-offset-2 hover:underline" href={`/management/jobs/${j.id}`}>{j.name ?? `Job #${j.id}`}</Link>
                  </li>
                ))}
              </ul>
            ) : (
              <div className="text-sm text-muted-foreground">Keine Jobs für diesen Kunden.</div>
            )}
          </CardContent>
        </Card>
        <HistoryCard table="contacts" dataId={id} />
      </div>
    </main>
  );
}
