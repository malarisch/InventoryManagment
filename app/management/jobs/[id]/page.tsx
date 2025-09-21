import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { JobEditForm } from "@/components/forms/job-edit-form";
import { HistoryCard } from "@/components/historyCard";
import { JobBookedAssetsCard } from "@/components/job-booked-assets";
import { JobQuickBook } from "@/components/forms/job-quick-book";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";

type JobRow = Tables<"jobs"> & {
  customers?: { id: number; company_name: string | null; forename: string | null; surname: string | null } | null;
};

function customerDisplay(c: JobRow["customers"] | null | undefined): string {
  if (!c) return "—";
  const company = c.company_name?.trim();
  const fn = c.forename?.trim();
  const sn = c.surname?.trim();
  if (company) return company;
  const person = [fn, sn].filter(Boolean).join(" ").trim();
  return person || `#${c.id}`;
}

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("jobs")
    .select("*, customers:customer_id(id,company_name,forename,surname)")
    .eq("id", id)
    .limit(1)
    .single();

  if (error || !data) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center p-5">
        <div className="w-full max-w-3xl flex-1">
          <p className="text-red-600">Eintrag nicht gefunden.</p>
        </div>
      </main>
    );
  }

  const job = data as JobRow;
  const creator = await fetchUserDisplayAdmin(job.created_by ?? undefined);

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/jobs" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Job #{job.id}</CardTitle>
            <CardDescription>
              {job.name ?? "—"}
              {" • Typ: "}{job.type ?? "—"}
              {" • Kunde: "}{customerDisplay(job.customers)}
              <br />
              Zeitraum: {job.startdate ? formatDate(safeParseDate(job.startdate)) : "—"}
              {" – "}
              {job.enddate ? formatDate(safeParseDate(job.enddate)) : "—"}
              {" • Ort: "}{job.job_location ?? "—"}
              <br />
              Erstellt am: {formatDateTime(safeParseDate(job.created_at))} {`• Erstellt von: ${creator ?? (job.created_by === currentUserId ? 'Du' : fallbackDisplayFromId(job.created_by)) ?? '—'}`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <DeleteWithUndo table="jobs" id={job.id} payload={job as any} redirectTo="/management/jobs" />
            </div>
            <JobEditForm job={job} />
          </CardContent>
        </Card>
        <JobBookedAssetsCard jobId={id} />
        <Card>
          <CardHeader>
            <CardTitle>Schnell buchen</CardTitle>
            <CardDescription>Nach Artikelmenge, Equipment-ID oder Case.</CardDescription>
          </CardHeader>
          <CardContent>
            <JobQuickBook jobId={id} />
          </CardContent>
        </Card>
        <HistoryCard table="jobs" dataId={id} />
      </div>
    </main>
  );
}
