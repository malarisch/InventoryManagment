import { createClient } from "@/lib/supabase/server";
import { ScannerScreen } from "@/components/scanner/scanner-screen";
import type { ScannerMode } from "@/lib/scanner/actions";

const allowedModes = new Set<ScannerMode>(["lookup", "assign-location", "job-book", "job-pack"]);

type LocationPayload = { id: number; name: string | null; companyId: number } | null;
type JobPayload = { id: number; name: string | null; companyId: number } | null;

export const revalidate = 0;
export const dynamic = "force-dynamic";

export default async function ScannerPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = (await searchParams) ?? {};
  const modeParam = typeof params.mode === "string" ? (params.mode as string) : undefined;
  const initialMode = allowedModes.has(modeParam as ScannerMode) ? (modeParam as ScannerMode) : undefined;

  const locationId = typeof params.locationId === "string" ? Number(params.locationId) : undefined;
  const jobId = typeof params.jobId === "string" ? Number(params.jobId) : undefined;

  const supabase = await createClient();

  let initialLocation: LocationPayload = null;
  if (typeof locationId === "number" && Number.isFinite(locationId)) {
    const { data } = await supabase
      .from("locations")
      .select("id, name, company_id")
      .eq("id", locationId)
      .maybeSingle<{ id: number; name: string | null; company_id: number }>();
    if (data) {
      initialLocation = { id: data.id, name: data.name, companyId: data.company_id };
    }
  }

  let initialJob: JobPayload = null;
  if (typeof jobId === "number" && Number.isFinite(jobId)) {
    const { data } = await supabase
      .from("jobs")
      .select("id, name, company_id")
      .eq("id", jobId)
      .maybeSingle<{ id: number; name: string | null; company_id: number }>();
    if (data) {
      initialJob = { id: data.id, name: data.name, companyId: data.company_id };
    }
  }

  return (
    <main className="min-h-screen w-full flex justify-center">
      <div className="w-full max-w-3xl px-4 py-6">
        <ScannerScreen initialMode={initialMode} initialLocation={initialLocation} initialJob={initialJob} />
      </div>
    </main>
  );
}
