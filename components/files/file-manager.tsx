"use client";

import { useMemo, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ClipboardCopy, Globe, Lock } from "lucide-react";
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
  showTitle = true
}: {
  table: string;
  rowId: number;
  companyId?: number;
  isPublic?: boolean;
  initial?: unknown;
  className?: string;
  showTitle?: boolean;
}) {
  const supabase = useMemo(() => createClient(), []);
  const [items, setItems] = useState<FileEntry[]>(() => normalizeFileArray(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function uploadFile(file: File, name?: string, description?: string, isFilePublic?: boolean) {
    setBusy(true);
    setError(null);
    try {
      const safeName = file.name.replace(/[^\w\.-]+/g, "_");
      const usePublicBucket = isPublic || isFilePublic;
      const bucket = usePublicBucket ? "public-assets" : "private-attachments";
      const path = usePublicBucket
        ? `${companyId}/${table}/${rowId}/${Date.now()}_${safeName}`
        : `${companyId}/${table}/${rowId}/${Date.now()}_${safeName}`;
      const { error: upErr } = await supabase.storage.from(bucket).upload(path, file, { upsert: false });
      if (upErr) throw upErr;

      let publicUrl = '';
      if (usePublicBucket) {
        const { data } = supabase.storage.from(bucket).getPublicUrl(path);
        publicUrl = data.publicUrl;
      } else {
        const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 60 * 60 * 24 * 365 * 10); // 10 years
        if (error) throw error;
        publicUrl = data.signedUrl;
      }

      const entry: FileEntry = { 
        id: path, 
        link: publicUrl, 
        name: name?.trim() || null, 
        description: description?.trim() || null,
        public: usePublicBucket
      };
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

  async function togglePublicAt(index: number) {
    setBusy(true);
    setError(null);
    try {
      const item = items[index];
      const wasPublic = item.public;
      const willBePublic = !wasPublic;
      
      // Create new file path and move file between buckets if needed
      const oldBucket = wasPublic ? "public-assets" : "private-attachments";
      const newBucket = willBePublic ? "public-assets" : "private-attachments";
      
      let newPath = item.id;
      let newUrl = item.link;
      
      if (wasPublic !== willBePublic) {
        // Need to move file between buckets
        const fileName = item.id.split('/').pop() || 'file';
        newPath = willBePublic
          ? `${companyId}/${table}/${rowId}/${Date.now()}_${fileName}`
          : `${companyId}/${table}/${rowId}/${Date.now()}_${fileName}`;
        
        // Download from old location
        const { data: fileData, error: downloadErr } = await supabase.storage
          .from(oldBucket)
          .download(item.id);
        if (downloadErr) throw downloadErr;
        
        // Upload to new location
        const { error: uploadErr } = await supabase.storage
          .from(newBucket)
          .upload(newPath, fileData, { upsert: false });
        if (uploadErr) throw uploadErr;
        
        // Get new URL
        if (willBePublic) {
          const { data } = supabase.storage.from(newBucket).getPublicUrl(newPath);
          newUrl = data.publicUrl;
        } else {
          const { data, error } = await supabase.storage
            .from(newBucket)
            .createSignedUrl(newPath, 60 * 60 * 24 * 365 * 10);
          if (error) throw error;
          newUrl = data.signedUrl;
        }
        
        // Delete old file (optional, could keep for safety)
        await supabase.storage.from(oldBucket).remove([item.id]);
      }
      
      const updatedItem: FileEntry = {
        ...item,
        id: newPath,
        link: newUrl,
        public: willBePublic
      };
      
      const next = [...items];
      next[index] = updatedItem;
      
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
      {showTitle && (
        <div className="mb-2 text-sm font-medium">Dateien</div>
      )}
      {items.length === 0 ? (
        <div className="text-xs text-muted-foreground mb-2">Keine Dateien vorhanden.</div>
      ) : (
        <ul className="mb-3 space-y-2">
          {items.map((f, i) => (
            <li key={`${f.id}-${i}`} className="rounded border p-2">
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <a 
                      className="truncate underline-offset-2 hover:underline text-sm" 
                      href={f.link} 
                      target="_blank" 
                      rel="noreferrer"
                    >
                      {f.name || f.id.split('/').pop()}
                    </a>
                    <Badge variant={f.public ? "default" : "secondary"} className="text-xs">
                      {f.public ? (
                        <>
                          <Globe className="w-3 h-3 mr-1" />
                          Öffentlich
                        </>
                      ) : (
                        <>
                          <Lock className="w-3 h-3 mr-1" />
                          Privat
                        </>
                      )}
                    </Badge>
                  </div>
                  {f.description ? (
                    <div className="text-xs text-muted-foreground truncate mt-1">{f.description}</div>
                  ) : null}
                </div>
                <div className="flex gap-2">
                  {f.public ? (
                  
                  <Button
                
                
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => {navigator.clipboard.writeText(f.link)}} 
                    disabled={busy}
                    title="Link Kopieren"
                    ><ClipboardCopy className="w-4 h-4" /></Button>
                  ) : null}
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => togglePublicAt(i)} 
                    disabled={busy}
                    title={f.public ? "Als privat markieren" : "Öffentlich machen"}
                  >
                    {f.public ? <Lock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    onClick={() => removeAt(i)} 
                    disabled={busy}
                  >
                    Entfernen
                  </Button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <FileUpload onUpload={uploadFile} disabled={busy} allowPublic={!isPublic} />
      {error && <div className="mt-2 text-xs text-red-600">{error}</div>}
    </div>
  );
}

function FileUpload({ 
  onUpload, 
  disabled, 
  allowPublic = false 
}: { 
  onUpload: (file: File, name?: string, description?: string, isFilePublic?: boolean) => void | Promise<void>; 
  disabled?: boolean;
  allowPublic?: boolean;
}) {
  const [file, setFile] = useState<File | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isFilePublic, setIsFilePublic] = useState(false);

  return (
    <div className="grid gap-2">
      <Label>Neue Datei hochladen</Label>
      <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} disabled={disabled} />
      <div className="grid gap-2 sm:grid-cols-2">
        <Input placeholder="Name (optional)" value={name} onChange={(e) => setName(e.target.value)} disabled={disabled} />
        <Input placeholder="Beschreibung (optional)" value={description} onChange={(e) => setDescription(e.target.value)} disabled={disabled} />
      </div>
      {allowPublic && (
        <div className="flex items-center space-x-2">
          <Checkbox 
            id="public-file"
            checked={isFilePublic}
            onCheckedChange={(checked) => setIsFilePublic(checked === true)}
            disabled={disabled}
          />
          <Label htmlFor="public-file" className="text-sm font-normal">
            Datei öffentlich zugänglich machen (für Logos, etc.)
          </Label>
        </div>
      )}
      <div>
        <Button
          type="button"
          onClick={() => file && onUpload(file, name, description, isFilePublic)}
          disabled={!file || disabled}
        >Hochladen</Button>
      </div>
    </div>
  );
}
