import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/server";
import { formatDate, formatDateTime, safeParseDate } from "@/lib/dates";
import { fallbackDisplayFromId } from "@/lib/userDisplay";
import { fetchUserDisplayAdmin } from "@/lib/users/userDisplay.server";
import type { Tables } from "@/database.types";

type JobCustomer = {
  id: number;
  company_name: string | null;
  forename: string | null;
  surname: string | null;
};

type UpcomingJobRow = Tables<"jobs"> & {
  customers: JobCustomer | null;
};

type HistoryRow = Tables<"history">;

const TABLE_LABELS: Record<string, string> = {
  articles: "Artikel",
  asset_tags: "Asset Tags",
  cases: "Cases",
  customers: "Kunden",
  equipments: "Equipments",
  jobs: "Jobs",
  locations: "Standorte",
};

const TABLE_ROUTES: Record<string, string> = {
  articles: "/management/articles",
  cases: "/management/cases",
  customers: "/management/customers",
  equipments: "/management/equipments",
  jobs: "/management/jobs",
  locations: "/management/locations",
};

const HISTORY_PREVIEW_KEYS = [
  "name",
  "title",
  "job_location",
  "type",
  "article_id",
  "equipment_id",
  "location_id",
  "customer_id",
  "case_id",
  "company_id",
] as const;

const QUICK_LINKS = [
  {
    label: "Equipments",
    description: "Pflege Status, Standort und Asset-Tags deiner Geräte.",
    href: "/management/equipments",
  },
  {
    label: "Jobs",
    description: "Plane Einsätze und buche Assets unkompliziert.",
    href: "/management/jobs",
  },
  {
    label: "Cases",
    description: "Strukturiere Gear in Cases und Sets für den schnellen Zugriff.",
    href: "/management/cases",
  },
  {
    label: "Company Settings",
    description: "Verwalte Unternehmens-Einstellungen und Seed-Dumps.",
    href: "/management/company-settings",
  },
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function truncate(value: string, max = 80): string {
  return value.length <= max ? value : `${value.slice(0, max - 1)}…`;
}

function formatTableLabel(table: string): string {
  const label = TABLE_LABELS[table];
  if (label) return label;
  return table.charAt(0).toUpperCase() + table.slice(1).replace(/_/g, " ");
}

function buildHistorySummary(payload: Record<string, unknown>): string {
  const parts: string[] = [];
  for (const key of HISTORY_PREVIEW_KEYS) {
    const raw = payload[key];
    if (raw === null || raw === undefined) continue;
    const text = typeof raw === "object" ? JSON.stringify(raw) : String(raw);
    if (text.trim().length === 0) continue;
    parts.push(`${key}: ${truncate(text)}`);
  }
  if (parts.length > 0) return parts.join(" • ");

  const entries = Object.entries(payload).filter(([key, value]) => key !== "_op" && value !== null && value !== undefined);
  if (entries.length > 0) {
    const [firstKey, firstValue] = entries[0];
    const text = typeof firstValue === "object" ? JSON.stringify(firstValue) : String(firstValue);
    if (text.trim().length > 0) return `${firstKey}: ${truncate(text)}`;
  }
  return "Keine Details";
}

function jobCustomerDisplay(customer: JobCustomer | null): string {
  if (!customer) return "Kein Kunde zugeordnet";
  const company = customer.company_name?.trim();
  if (company) return company;
  const fullName = [customer.forename, customer.surname].filter(Boolean).join(" ").trim();
  return fullName.length > 0 ? fullName : `Kunde #${customer.id}`;
}

function formatJobPeriod(job: UpcomingJobRow): string {
  const start = formatDate(safeParseDate(job.startdate));
  const end = formatDate(safeParseDate(job.enddate));
  if (start === "—" && end === "—") return "Termin offen";
  if (start === "—") return `Bis ${end}`;
  if (end === "—") return `Ab ${start}`;
  if (start === end) return start;
  return `${start} – ${end}`;
}

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Überblick über kommende Einsätze und die letzten Änderungen deiner Companies.
        </p>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <CardHeader className="pb-2">
              <CardDescription>{stat.label}</CardDescription>
              <CardTitle className="text-3xl font-semibold tracking-tight">
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

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
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
                        <p className="text-sm font-medium text-foreground">
                          {job.name?.trim() || `Job #${job.id}`}
                        </p>
                        <p className="text-xs text-muted-foreground">{jobCustomerDisplay(job.customers)}</p>
                      </div>
                      {job.type ? <Badge variant="secondary">{job.type}</Badge> : null}
                    </div>
                    <dl className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
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

        <Card>
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
                <div className="text-sm font-medium text-foreground">{link.label}</div>
                <div className="text-xs text-muted-foreground">{link.description}</div>
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
                      <tr key={entry.id} className="border-t border-border/60 even:bg-muted/30">
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
                        <td className="px-3 py-2 align-top text-xs">
                          <Badge variant="outline" className="uppercase">
                            {entry.op ? entry.op.toUpperCase() : "UPDATE"}
                          </Badge>
                        </td>
                        <td className="px-3 py-2 align-top text-xs text-muted-foreground">
                          {entry.summary}
                        </td>
                        <td className="px-3 py-2 align-top text-xs">{entry.actorDisplay}</td>
                      </tr>
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
