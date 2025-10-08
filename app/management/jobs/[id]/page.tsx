import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { JobNameProvider, JobNameHeading } from "@/components/jobs/job-name-context";
import { createClient } from "@/lib/supabase/server";
import { getActiveCompanyId } from "@/lib/companies.server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { safeParseDate, formatDateTime } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import { JobEditForm } from "@/components/forms/job-edit-form";
import { HistoryCard } from "@/components/historyCard";
import { JobBookedAssetsCard } from "@/components/job-booked-assets";
import { JobAssetSummaryCard } from "@/components/job-asset-summary";
import { JobQuickBook } from "@/components/forms/job-quick-book";
import { DeleteWithUndo } from "@/components/forms/delete-with-undo";
import { FileManager } from "@/components/files/file-manager";
import { Button } from "@/components/ui/button";
import { ClipboardList, PackageCheck } from "lucide-react";
import { JobHeaderContact } from "@/components/jobs/job-header-contact";

type JobRow = Tables<"jobs">;

// Force dynamic rendering so updates appear immediately after client-side router.refresh()
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function JobDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: idParam } = await params;
  const id = Number(idParam);
  const supabase = await createClient();
  const activeCompanyId = await getActiveCompanyId();
  
  if (!activeCompanyId) {
    return (
      <main className="min-h-screen w-full flex flex-col items-center p-5">
        <div className="w-full max-w-none flex-1">
          <p className="text-red-600">Keine aktive Company ausgewählt.</p>
        </div>
      </main>
    );
  }
  
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;
  const { data, error } = await supabase
    .from("jobs")
    .select("*")
    .eq("id", id)
    .eq("company_id", activeCompanyId)
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
  
  // Fetch contact if exists
  let contactDisplay: string | null = null;
  if (job.contact_id) {
    const { data: contactData } = await supabase
      .from("contacts")
      .select("id, display_name, company_name, first_name, last_name")
      .eq("id", job.contact_id)
      .eq("company_id", activeCompanyId)
      .limit(1)
      .single();
    
    if (contactData) {
      contactDisplay = contactData.display_name || 
                       contactData.company_name || 
                       `${contactData.first_name ?? ""} ${contactData.last_name ?? ""}`.trim() || 
                       `Kontakt #${contactData.id}`;
    }
  }
  
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
        
        {/* 2-column layout: 2/3 for main content, 1/3 for sidebar */}
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          {/* Left column: Main content (2/3) */}
          <div className="xl:col-span-2 space-y-4">
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-lg">
                  <JobNameHeading data-testid="job-title" fallback={title} />
                </CardTitle>
                <CardDescription className="flex flex-wrap items-center gap-2 text-xs">
                  <span>Job-ID #{job.id} • Erstellt am {createdDisplay} • Erstellt von {creatorDisplay}</span>
                  <span className="text-muted-foreground">•</span>
                  <JobHeaderContact 
                    jobId={job.id} 
                    companyId={job.company_id} 
                    contactId={job.contact_id} 
                    contactDisplay={contactDisplay}
                  />
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                  <DeleteWithUndo table="jobs" id={job.id} payload={job as Record<string, unknown>} redirectTo="/management/jobs" />
                  <div className="flex items-center gap-2 flex-wrap">
                    <Button variant="outline" size="sm" asChild className="flex items-center gap-1.5">
                      <Link href={`/management/scanner?mode=job-book&jobId=${job.id}`}>
                        <ClipboardList className="h-3.5 w-3.5" />
                        <span className="text-xs">Kameramodus buchen</span>
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" asChild className="flex items-center gap-1.5">
                      <Link href={`/management/scanner?mode=job-pack&jobId=${job.id}`}>
                        <PackageCheck className="h-3.5 w-3.5" />
                        <span className="text-xs">Kameramodus packen</span>
                      </Link>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Form now at top level (no nested Cards) */}
            <JobEditForm job={job} />

            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-lg">Dateien</CardTitle>
                <CardDescription className="text-xs">Anhänge und Dokumente zu diesem Job</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <FileManager table="jobs" rowId={job.id} companyId={job.company_id} isPublic={false} initial={(job as Record<string, unknown>).files} />
              </CardContent>
            </Card>

            <HistoryCard table="jobs" dataId={id} extraTables={["job_booked_assets", "job_assets_on_job"]} />
          </div>

          {/* Right column: Sidebar (1/3) */}
          <div className="xl:col-span-1 space-y-4">
            <JobAssetSummaryCard jobId={id} />
            
            <Card>
              <CardHeader className="pb-3 px-4 pt-4">
                <CardTitle className="text-base">Schnell buchen</CardTitle>
                <CardDescription className="text-xs">Nach Artikelmenge, Equipment-ID oder Case.</CardDescription>
              </CardHeader>
              <CardContent className="px-4 pb-4">
                <JobQuickBook jobId={id} />
              </CardContent>
            </Card>

            <JobBookedAssetsCard jobId={id} />
          </div>
        </div>
        
        </JobNameProvider>
      </div>
    </main>
  );
}
