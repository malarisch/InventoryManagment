import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { JobEditForm } from "@/components/forms/job-edit-form";
import { HistoryCard } from "@/components/historyCard";
import { JobBookedAssetsCard } from "@/components/job-booked-assets";
import { JobQuickBook } from "@/components/forms/job-quick-book";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";

type JobRow = Tables<"jobs">;

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
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
  const createdDisplay = formatDateTime(safeParseDate(job.created_at));
  const creatorDisplay = creator ?? (job.created_by === currentUserId ? "Du" : fallbackDisplayFromId(job.created_by)) ?? "—";
  const jobName = job.name?.trim();
  const title = jobName && jobName.length > 0 ? jobName : `Job #${job.id}`;

  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/jobs" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>{title}</CardTitle>
            <CardDescription>
              Job-ID #{job.id} • Erstellt am {createdDisplay} • Erstellt von {creatorDisplay}
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
