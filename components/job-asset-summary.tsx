import { createClient } from "@/lib/supabase/server";
import { fetchAssetSummary } from "@/lib/jobs/asset-summary";
import { JobAssetSummaryClient } from "@/components/job-asset-summary.client";
export async function JobAssetSummaryCard({ jobId }: { jobId: number }) {
  const supabase = await createClient();
  const summary = await fetchAssetSummary(supabase, jobId);

  return <JobAssetSummaryClient jobId={jobId} initialSummary={summary} />;
}
