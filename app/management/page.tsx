import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, safeParseDate } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import type { Tables } from "@/database.types";
import {
  QUICK_LINKS,
  TABLE_ROUTES,
  buildHistorySummary,
  formatJobPeriod,
  formatTableLabel,
  isRecord,
  jobCustomerDisplay,
  type JobCustomer,
} from "@/app/management/_libs/dashboard-utils";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, PlusCircle, Pencil, Trash2 } from "lucide-react";

/**
 * Jobs row enriched with the optional customer relation for dashboard usage.
 */
type UpcomingJobRow = Tables<"jobs"> & {
  customers: JobCustomer | null;
};

/**
 * History record shape retrieved from Supabase for recent change log entries.
 */
type HistoryRow = Tables<"history">;

/**
 * Management dashboard landing screen showing inventory stats, upcoming jobs
 * and the latest audit history entries for the active company.
 */
export default async function ManagementHomePage() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  const currentUserId = auth.user?.id ?? null;

  const isoNow = new Date().toISOString();

  const [
    equipmentsCountResult,
    articlesCountResult,
    jobsCountResult,
    customersCountResult,
    upcomingResult,
    historyResult,
  ] = await Promise.all([
    supabase.from("equipments").select("id", { count: "exact", head: true }),
    supabase.from("articles").select("id", { count: "exact", head: true }),
    supabase.from("jobs").select("id", { count: "exact", head: true }),
    supabase.from("customers").select("id", { count: "exact", head: true }),
    supabase
      .from("jobs")
      .select(
        "id,name,startdate,enddate,type,job_location,customers:customer_id(id,company_name,forename,surname)",
      )
      .or(`startdate.gte.${isoNow},and(startdate.is.null,enddate.gte.${isoNow})`)
      .order("startdate", { ascending: true, nullsFirst: false })
      .order("created_at", { ascending: true })
      .limit(6),
    supabase.from("history").select("*").order("created_at", { ascending: false }).limit(20),
  ]);

  const stats = [
    {
      key: "equipments",
      label: "Equipments",
      hint: "Geräte im Bestand.",
      value: equipmentsCountResult.count ?? 0,
      error: equipmentsCountResult.error?.message ?? null,
    },
    {
      key: "articles",
      label: "Artikel",
      hint: "Produktdefinitionen.",
      value: articlesCountResult.count ?? 0,
      error: articlesCountResult.error?.message ?? null,
    },
    {
      key: "jobs",
      label: "Jobs",
      hint: "Geplante Einsätze.",
      value: jobsCountResult.count ?? 0,
      error: jobsCountResult.error?.message ?? null,
    },
    {
      key: "customers",
      label: "Kunden",
      hint: "Aktive Kontakte.",
      value: customersCountResult.count ?? 0,
      error: customersCountResult.error?.message ?? null,
    },
  ] as const;

  const upcomingJobs = (upcomingResult.data as UpcomingJobRow[] | null) ?? [];
  const upcomingError = upcomingResult.error;

  const historyRows = (historyResult.data as HistoryRow[] | null) ?? [];
  const historyError = historyResult.error;

  const uniqueActorIds = Array.from(
    new Set(
      historyRows
        .map((row) => row.change_made_by)
        .filter((id): id is string => typeof id === "string" && id.length > 0),
    ),
  );

  const actorEntries = await Promise.all(
    uniqueActorIds.map(async (id) => [id, await fetchUserDisplayAdmin(id)] as const),
  );

  const actorMap = new Map<string, string>();
  for (const [id, display] of actorEntries) {
    if (display) actorMap.set(id, display);
  }

  const historyEntries = historyRows.map((row) => {
    const payload = isRecord(row.old_data) ? (row.old_data as Record<string, unknown>) : {};
    const op = typeof payload["_op"] === "string" ? (payload["_op"] as string) : null;
    const hrefBase = TABLE_ROUTES[row.table_name];
    const actorDisplay =
      row.change_made_by && row.change_made_by === currentUserId
        ? "Du"
        : row.change_made_by
        ? actorMap.get(row.change_made_by) ?? (fallbackDisplayFromId(row.change_made_by) ?? "Unbekannt")
        : "System";
    return {
      id: row.id,
      createdAt: row.created_at,
      table: row.table_name,
      tableLabel: formatTableLabel(row.table_name),
      dataId: row.data_id,
      summary: buildHistorySummary(payload),
      op,
      href: hrefBase ? `${hrefBase}/${row.data_id}` : null,
      actorDisplay,
    };
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          Überblick über kommende Einsätze und die letzten Änderungen deiner Companies.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-4xl font-bold">
                {stat.error ? "—" : stat.value.toLocaleString("de-DE")}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stat.error ? (
                <p className="text-sm text-destructive">{stat.error}</p>
              ) : (
                <p className="text-sm text-muted-foreground">{stat.hint}</p>
              )}
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-5">
        <Card className="lg:col-span-1 xl:col-span-3">
          <CardHeader className="pb-3">
            <CardTitle>Kommende Veranstaltungen</CardTitle>
            <CardDescription>Termine aus deinen Jobs mit Start oder Ende in der Zukunft.</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingError ? (
              <p className="text-sm text-destructive">Fehler beim Laden: {upcomingError.message}</p>
            ) : upcomingJobs.length === 0 ? (
              <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
                Keine kommenden Veranstaltungen gefunden. Plane deinen nächsten Einsatz unter{" "}
                <Link className="underline underline-offset-4" href="/management/jobs/new">
                  Jobs
                </Link>
                .
              </div>
            ) : (
              <div className="space-y-4">
                {upcomingJobs.map((job) => (
                  <Link
                    key={job.id}
                    href={`/management/jobs/${job.id}`}
                    className="block rounded-md border border-border/70 bg-card p-4 transition hover:border-primary"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="font-semibold text-foreground">
                          {job.name?.trim() || `Job #${job.id}`}
                        </p>
                        <p className="text-sm text-muted-foreground">{jobCustomerDisplay(job.customers)}</p>
                      </div>
                      {job.type ? <Badge variant="secondary">{job.type}</Badge> : null}
                    </div>
                    <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
                      <div className="flex flex-col gap-0.5">
                        <dt className="font-medium text-muted-foreground">Zeitraum</dt>
                        <dd className="text-foreground">{formatJobPeriod(job)}</dd>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <dt className="font-medium text-muted-foreground">Ort</dt>
                        <dd className="text-foreground">{job.job_location?.trim() || "Noch offen"}</dd>
                      </div>
                    </dl>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-1 xl:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle>Schnellzugriffe</CardTitle>
            <CardDescription>Arbeite direkt in den wichtigsten Bereichen weiter.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {QUICK_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block rounded-md border border-border/60 bg-background px-3 py-3 transition hover:border-primary hover:bg-accent/20"
              >
                <div className="font-semibold text-foreground">{link.label}</div>
                <div className="text-sm text-muted-foreground">{link.description}</div>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Aktuelle Historie</CardTitle>
          <CardDescription>Letzte 20 Änderungen über alle Tabellen hinweg.</CardDescription>
        </CardHeader>
        <CardContent>
          {historyError ? (
            <p className="text-sm text-destructive">Fehler beim Laden: {historyError.message}</p>
          ) : historyEntries.length === 0 ? (
            <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
              Noch keine Aktivitäten vorhanden.
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <div className="max-h-96 overflow-auto">
                <table className="w-full min-w-[680px] border-collapse text-sm">
                  <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Zeitpunkt
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Bereich
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Datensatz
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Aktion
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Details
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Nutzer
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {historyEntries.map((entry) => (
                      <Collapsible key={`row-${entry.id}`}>
                        <tr key={`main-${entry.id}`} className="border-t border-border/60 even:bg-muted/30">
                          <td className="px-3 py-2 align-top text-xs">
                            <CollapsibleTrigger asChild>
                              <button className="flex items-center space-x-1">
                                <Badge variant="outline" className="uppercase">
                                  {entry.op === 'INSERT' ? <PlusCircle className="w-4 h-4 mr-1" /> : entry.op === 'DELETE' ? <Trash2 className="w-4 h-4 mr-1" /> : <Pencil className="w-4 h-4 mr-1" />}
                                  {entry.op ? entry.op.toUpperCase() : "UPDATE"}
                                </Badge>
                                <ChevronDown className="w-4 h-4" />
                              </button>
                            </CollapsibleTrigger>
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                            {formatDateTime(safeParseDate(entry.createdAt))}
                          </td>
                          <td className="px-3 py-2 align-top text-xs">{entry.tableLabel}</td>
                          <td className="px-3 py-2 align-top text-xs">
                            {entry.href ? (
                              <Link className="underline underline-offset-4" href={entry.href}>
                                #{entry.dataId}
                              </Link>
                            ) : (
                              <>#{entry.dataId}</>
                            )}
                          </td>
                          <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                            {entry.summary}
                          </td>
                          <td className="px-3 py-2 align-top text-xs">{entry.actorDisplay}</td>
                        </tr>
                        <CollapsibleContent>
                          <tr key={`expanded-${entry.id}`} className="bg-muted/20">
                            <td colSpan={6} className="p-4">
                              <pre className="text-xs overflow-auto">{JSON.stringify(entry.summary, null, 2)}</pre>
                            </td>
                          </tr>
                        </CollapsibleContent>
                      </Collapsible>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
