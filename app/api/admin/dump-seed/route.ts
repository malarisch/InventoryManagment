import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function sqlEscapeString(s: string) {
  return s.replace(/'/g, "''");
}

function sqlValue(v: unknown): string {
  if (v === null || v === undefined) return "NULL";
  if (typeof v === "number") return Number.isFinite(v) ? String(v) : "NULL";
  if (typeof v === "boolean") return v ? "true" : "false";
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === "object") return `'${sqlEscapeString(JSON.stringify(v))}'::jsonb`;
  return `'${sqlEscapeString(String(v))}'`;
}

export async function POST() {
  try {
    const supabase = await createServerSupabase();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    // Optional: require that user owns at least one company
    const { data: owned } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_user_id", auth.user.id)
      .limit(1);
    if (!owned || owned.length === 0) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Use admin client to freely read auth + public
    const admin = createAdminClient();

    // Fetch data in FK-friendly order
    const [
      companies,
      usersCompanies,
      assetTagTemplates,
      assetTags,
      locations,
      articles,
      customers,
      jobs,
      equipments,
      cases,
      jobBookedAssets,
      jobAssetsOnJob,
      history,
      users,
      identities,
    ] = await Promise.all([
      admin.from("companies").select("*").order("id"),
      admin.from("users_companies").select("*").order("id"),
      admin.from("asset_tag_templates").select("*").order("id"),
      admin.from("asset_tags").select("*").order("id"),
      admin.from("locations").select("*").order("id"),
      admin.from("articles").select("*").order("id"),
      admin.from("contacts").select("*").order("id"),
      admin.from("jobs").select("*").order("id"),
      admin.from("equipments").select("*").order("id"),
      admin.from("cases").select("*").order("id"),
      admin.from("job_booked_assets").select("*").order("id"),
      admin.from("job_assets_on_job").select("*").order("id"),
      admin.from("history").select("*").order("id"),
      admin
        .schema("auth")
        .from("users")
        .select("id, email, raw_user_meta_data, created_at, updated_at, last_sign_in_at")
        .order("id"),
      admin
        .schema("auth")
        .from("identities")
        .select("*")
        .order("id"),
    ]);

    function buildInserts(table: string, rows: ReadonlyArray<Record<string, unknown>>, columns?: string[]) {
      if (!rows || rows.length === 0) return "";
      const cols = columns ?? Object.keys(rows[0]);
      const values = rows
        .map((r) => `(${cols.map((c) => sqlValue(r[c])).join(", ")})`)
        .join(",\n");
      return `truncate table ${table} restart identity cascade;\ninsert into ${table} (${cols.join(", ")}) values\n${values};\n\n`;
    }

    let sql = "-- Generated seed for public + auth (data only)\nBEGIN;\n\n";
    // auth.users (limited columns) then auth.identities
    if (users && users.data) {
      const rows = (users.data ?? []) as Record<string, unknown>[];
      const cols = ["id", "email", "raw_user_meta_data", "created_at", "updated_at", "last_sign_in_at"];
      sql += buildInserts("auth.users", rows, cols);
    }
    if (identities && identities.data) {
      const rows = (identities.data ?? []) as Record<string, unknown>[];
      // derive columns from first row to be robust across versions
      const cols = rows.length ? Object.keys(rows[0]) : ["id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "email"].filter(Boolean);
      sql += buildInserts("auth.identities", rows, cols);
    }
    if (companies && companies.data) sql += buildInserts("public.companies", companies.data as Record<string, unknown>[]);
    if (usersCompanies && usersCompanies.data) sql += buildInserts("public.users_companies", usersCompanies.data as Record<string, unknown>[]);
    if (assetTagTemplates && assetTagTemplates.data) sql += buildInserts("public.asset_tag_templates", assetTagTemplates.data as Record<string, unknown>[]);
    if (assetTags && assetTags.data) sql += buildInserts("public.asset_tags", assetTags.data as Record<string, unknown>[]);
    if (locations && locations.data) sql += buildInserts("public.locations", locations.data as Record<string, unknown>[]);
    if (articles && articles.data) sql += buildInserts("public.articles", articles.data as Record<string, unknown>[]);
    if (customers && customers.data) sql += buildInserts("public.contacts", customers.data as Record<string, unknown>[]);
    if (jobs && jobs.data) sql += buildInserts("public.jobs", jobs.data as Record<string, unknown>[]);
    if (equipments && equipments.data) sql += buildInserts("public.equipments", equipments.data as Record<string, unknown>[]);
    if (cases && cases.data) sql += buildInserts("public.cases", cases.data as Record<string, unknown>[]);
    if (jobBookedAssets && jobBookedAssets.data) sql += buildInserts("public.job_booked_assets", jobBookedAssets.data as Record<string, unknown>[]);
    if (jobAssetsOnJob && jobAssetsOnJob.data) sql += buildInserts("public.job_assets_on_job", jobAssetsOnJob.data as Record<string, unknown>[]);
    if (history && history.data) sql += buildInserts("public.history", history.data as Record<string, unknown>[]);
    sql += "COMMIT;\n";

    // Write to repo root supabase/seed.sql (Next app lives in ./inventorymanagement)
    const outDir = path.join(process.cwd(), ".", "supabase");
    const outPath = path.join(outDir, "seed.sql");
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outPath, sql, "utf8");

    return NextResponse.json({ ok: true, path: "./supabase/seed.sql", bytes: Buffer.byteLength(sql) });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
