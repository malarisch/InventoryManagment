import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import { JobBookedAssetsList } from "@/components/job-booked-assets.client";

type Booked = Tables<"job_booked_assets"> & {
  equipments?: { id: number; article_id: number | null; articles?: { name: string | null } | null } | null;
  cases?: { id: number } | null;
};

export async function JobBookedAssetsCard({ jobId }: { jobId: number }) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("job_booked_assets")
    .select("*, equipments:equipment_id(id, article_id, articles:article_id(name)), cases:case_id(id)")
    .eq("job_id", jobId)
    .order("created_at", { ascending: false });

  const rows = (data as Booked[] | null) ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gebuchte Assets</CardTitle>
        <CardDescription>{rows.length} Einträge</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-sm text-red-600">Fehler beim Laden: {error.message}</div>
        ) : (
          <JobBookedAssetsList jobId={jobId} initial={rows} />
        )}
      </CardContent>
    </Card>
  );
}
