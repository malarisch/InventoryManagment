"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { FileEntry } from "@/lib/files";
import { normalizeFileArray } from "@/lib/files";

/**
 * Generic file manager to attach files to any table row that exposes a `files jsonb` column.
 *
 * - Uploads files to the public storage bucket `attachments` under `<table>/<id>/...`.
 * - Writes an entry to the row's `files` array with { id, link, name?, description? }.
 * - Allows deleting entries (removes from array; does not delete from storage).
 */
export function FileManager({
  table,
  rowId,
  companyId,
  isPublic,
  initial,
  className,
}: {
  table: string;
  rowId: number;
  companyId?: number;
  isPublic?: boolean;
  initial?: unknown;
  className?: string;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<FileEntry[]>(() => normalizeFileArray(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File, name?: string, description?: string) {
    setBusy(true);
    setError(null);
    try {
      const safeName = file.name.replace(/[^\w\.-]+/g, "_");
      const bucket = isPublic ? "public-assets" : "private-attachments";
      const path = isPublic
        ? `${table}/${rowId}/${Date.now()}_${safeName}`
        : `${companyId}/${table}/${rowId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      let publicUrl = '';
      if (isPublic) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        publicUrl = data.publicUrl;
      } else {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
        if (error) throw error;
        publicUrl = data.signedUrl;
      }

      const entry: FileEntry = { id: path, link: publicUrl, name: name?.trim() || null, description: description?.trim() || null };
      const next = [...items, entry];
      const { error: upRowErr } = await supabase
        .from(table)
        .update({ files: next })
        .eq("id", rowId);
      if (upRowErr) throw upRowErr;
      setItems(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  async function removeAt(index: number) {
    setBusy(true);
    setError(null);
    try {
      const next = items.filter((_, i) => i !== index);
      const { error: upRowErr } = await supabase
        .from(table)
        .update({ files: next })
        .eq("id", rowId);
      if (upRowErr) throw upRowErr;
      setItems(next);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : String(e));
    }
    setBusy(false);
  }

  return (
    <div className={className}>
      <div className="mb-2 text-sm font-medium">Dateien</div>
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground mb-2">Keine Dateien vorhanden.</div>
      ) : (
        <ul className="mb-3 space-y-2">
          {items.map((f, i) => (
            <li key={`${f.id}-${i}`} className="flex items-center justify-between rounded border p-2 text-sm">
              <div className="min-w-0">
                <a className="truncate underline-offset-2 hover:underline" href={f.link} target="_blank" rel="noreferrer">
                  {f.name || f.id.split('/').pop()}
                </a>
                {f.description ? (
                  <div className="text-xs text-muted-foreground truncate">{f.description}</div>
                ) : null}
              </div>
              <Button type="button" variant="outline" size="sm" onClick={() => removeAt(i)} disabled={busy}>Entfernen</Button>
            </li>
          ))}
        </ul>
      )}

      <FileUpload onUpload={uploadFile} disabled={busy} />
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
}

function FileUpload({ onUpload, disabled }: { onUpload: (file: File, name?: string, description?: string) => void | Promise<void>; disabled?: boolean; }) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  return (
    <div className="grid gap-2">
      <Label>Neue Datei hochladen</Label>
      <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={disabled} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} />
        <Input placeholder="Beschreibung (optional)" value={description} onChange={(e) => setDescription(e.target.value)} disabled={disabled} />
      </div>
      <div>
        <Button
          type="button"
          onClick={() => file && onUpload(file, name, description)}
          disabled={!file || disabled}
        >Hochladen</Button>
      </div>
    </div>
  );
}
