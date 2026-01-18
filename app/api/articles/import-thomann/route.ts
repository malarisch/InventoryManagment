import { NextResponse } from "next/server";
import { metadataFromThomann } from "@/lib/tools/metadataFromThomann";
import { getActiveCompanyId } from "@/lib/companies.server";
import { createClient } from "@/lib/supabase/server";
import type { Json } from "@/database.types";

/**
 * POST /api/articles/import-thomann
 *
 * Fetches article metadata from a Thomann product URL, creates a new article
 * for the active company, and returns the created article ID. The article name
 * is derived from `${manufacturer} ${model}` of the fetched metadata.
 */
export async function POST(req: Request) {
  try {
    const { url } = (await req.json()) as { url?: string };
    const trimmedUrl = url?.trim();

    if (!trimmedUrl) {
      return NextResponse.json({ error: "Bitte eine Thomann-URL angeben." }, { status: 400 });
    }

    const supabase = await createClient();
    const { data: auth } = await supabase.auth.getUser();

    if (!auth.user) {
      return NextResponse.json({ error: "Nicht angemeldet." }, { status: 401 });
    }

    const companyId = await getActiveCompanyId();
    if (!companyId) {
      return NextResponse.json({ error: "Keine aktive Company gefunden." }, { status: 400 });
    }

    const metadata = await metadataFromThomann(trimmedUrl);
    if (!metadata) {
      return NextResponse.json({ error: "Metadaten konnten nicht geladen werden." }, { status: 400 });
    }

    const articleName = [metadata.manufacturer?.trim(), metadata.model?.trim()]
      .filter((part) => part && part.length > 0)
      .join(" ")
      .trim();

    if (!articleName) {
      return NextResponse.json({ error: "Hersteller oder Modell fehlen in den Metadaten." }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("articles")
      .insert({
        name: articleName,
        company_id: companyId,
        created_by: auth.user.id,
        metadata: metadata as unknown as Json,
      })
      .select("id")
      .single();

    if (error || !data) {
      return NextResponse.json({ error: error?.message ?? "Artikel konnte nicht erstellt werden." }, { status: 500 });
    }

    return NextResponse.json({ id: data.id, name: articleName });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unbekannter Fehler";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}