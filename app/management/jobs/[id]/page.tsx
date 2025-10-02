import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JobNameProvider, JobNameHeading } from "@/components/jobs/job-name-context";
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
import { FileManager } from "@/components/files/file-manager";
import { Button } from "@/components/ui/button";
import { ClipboardList, PackageCheck } from "lucide-react";

type JobRow = Tables<"jobs">;

// Force dynamic rendering so updates appear immediately after client-side router.refresh()
export const dynamic = "force-dynamic";
export const revalidate = 0;

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
        <div className="w-full max-w-none flex-1">
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
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/jobs" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <JobNameProvider initialName={title}>
        <Card>
          <CardHeader>
            <CardTitle>
              <JobNameHeading data-testid="job-title" fallback={title} />
            </CardTitle>
            <CardDescription>
              Job-ID #{job.id} • Erstellt am {createdDisplay} • Erstellt von {creatorDisplay}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <DeleteWithUndo table="jobs" id={job.id} payload={job as Record<string, unknown>} redirectTo="/management/jobs" />
              <div className="flex items-center gap-2">
                <Button variant="outline" asChild className="flex items-center gap-2">
                  <Link href={`/management/scanner?mode=job-book&jobId=${job.id}`}>
                    <ClipboardList className="h-4 w-4" />
                    Kameramodus buchen
                  </Link>
                </Button>
                <Button variant="outline" asChild className="flex items-center gap-2">
                  <Link href={`/management/scanner?mode=job-pack&jobId=${job.id}`}>
                    <PackageCheck className="h-4 w-4" />
                    Kameramodus packen
                  </Link>
                </Button>
              </div>
            </div>
            <JobEditForm job={job} />
            <div className="mt-6">
              <FileManager table="jobs" rowId={job.id} companyId={job.company_id} isPublic={false} initial={(job as Record<string, unknown>).files} />
            </div>
          </CardContent>
        </Card>
        </JobNameProvider>
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
        <HistoryCard table="jobs" dataId={id} extraTables={["job_booked_assets", "job_assets_on_job"]} />
      </div>
    </main>
  );
}
