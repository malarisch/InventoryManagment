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

function sqlValue(v: any): string {
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
    const [companies, locations, articles, equipments, history, users, identities] = await Promise.all([
      admin.from("companies").select("*").order("id"),
      admin.from("locations").select("*").order("id"),
      admin.from("articles").select("*\n, default_location, company_id, name, metadata, created_at, created_by, id").order("id"),
      admin.from("equipments").select("*").order("id"),
      admin.from("article_location_history").select("*").order("id"),
      admin.schema("auth").from("users" as any).select("id, email, raw_user_meta_data, created_at, updated_at, last_sign_in_at").order("id"),
      admin.schema("auth").from("identities" as any).select("*").order("id"),
    ]);

    function buildInserts(table: string, rows: any[], columns?: string[]) {
      if (!rows || rows.length === 0) return "";
      const cols = columns ?? Object.keys(rows[0]);
      const values = rows
        .map((r) => `(${cols.map((c) => sqlValue((r as any)[c])).join(", ")})`)
        .join(",\n");
      return `truncate table ${table} restart identity cascade;\ninsert into ${table} (${cols.join(", ")}) values\n${values};\n\n`;
    }

    let sql = "-- Generated seed for public + auth (data only)\nBEGIN;\n\n";
    // auth.users (limited columns) then auth.identities
    if (users && users.data) {
      const rows = users.data as any[];
      const cols = ["id", "email", "raw_user_meta_data", "created_at", "updated_at", "last_sign_in_at"];
      sql += buildInserts("auth.users", rows, cols);
    }
    if (identities && identities.data) {
      const rows = identities.data as any[];
      // derive columns from first row to be robust across versions
      const cols = rows.length ? Object.keys(rows[0]) : ["id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "email"].filter(Boolean);
      sql += buildInserts("auth.identities", rows, cols);
    }
    if (companies && companies.data) sql += buildInserts("public.companies", companies.data as any[]);
    if (locations && locations.data) sql += buildInserts("public.locations", locations.data as any[]);
    if (articles && articles.data) sql += buildInserts("public.articles", articles.data as any[]);
    if (equipments && equipments.data) sql += buildInserts("public.equipments", equipments.data as any[]);
    if (history && history.data) sql += buildInserts("public.article_location_history", history.data as any[]);
    sql += "COMMIT;\n";

    // Write to repo root supabase/seed.sql (Next app lives in ./inventorymanagement)
    const outDir = path.join(process.cwd(), "..", "supabase");
    const outPath = path.join(outDir, "seed.sql");
    await fs.mkdir(outDir, { recursive: true });
    await fs.writeFile(outPath, sql, "utf8");

    return NextResponse.json({ ok: true, path: "../supabase/seed.sql", bytes: Buffer.byteLength(sql) });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}
