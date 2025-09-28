import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { CustomerEditForm } from "@/components/forms/customer-edit-form";
import { HistoryCard } from "@/components/historyCard";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";
import { FileManager } from "@/components/files/file-manager";

type Customer = Tables<"customers">;

function displayName(c: Customer): string {
  const company = c.company_name?.trim();
  if (company) return company;
  const full = `${c.forename ?? ""} ${c.surname ?? ""}`.trim();
  return full || `#${c.id}`;
}

export default async function CustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center p-5">
        <div className="w-full max-w-7xl flex-1">
          <p className="text-red-600">Eintrag nicht gefunden.</p>
        </div>
      </main>
    );
  }

  const cust = data as Customer;
  console.log('Customer detail page - customer data:', JSON.stringify(cust, null, 2));
  const creator = await fetchUserDisplayAdmin(cust.created_by ?? undefined);

  const { data: jobsData } = await supabase
    .from("jobs")
    .select("id, name, startdate, enddate")
    .eq("customer_id", id)
    .order("created_at", { ascending: false })
    .limit(50);
  const jobs = (jobsData as Array<{ id: number; name: string | null; startdate: string | null; enddate: string | null }> | null) ?? [];

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-7xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/customers" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle id="customer-title">{displayName(cust)}</CardTitle>
            <CardDescription>
              #{cust.id} {cust.type ? `• ${cust.type}` : ""}
              <br />
              E-Mail: {cust.email ?? "—"} • Adresse: {cust.address ?? "—"}{cust.postal_code ? `, ${cust.postal_code}` : ""}{cust.country ? `, ${cust.country}` : ""}
              <br />
              Erstellt am: {formatDateTime(safeParseDate(cust.created_at))} {`• Erstellt von: ${creator ?? (cust.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(cust.created_by)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <DeleteWithUndo table="customers" id={cust.id} payload={cust as Record<string, unknown>} redirectTo="/management/customers" />
            </div>
            <CustomerEditForm customer={cust} />
            <div className="mt-6">
              <FileManager table="customers" rowId={cust.id} companyId={cust.company_id} isPublic={false} initial={(cust as Record<string, unknown>).files} />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Jobs dieses Kunden</CardTitle>
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
        <HistoryCard table="customers" dataId={id} />
      </div>
    </main>
  );
}
