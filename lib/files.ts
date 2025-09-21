/**
 * File attachments helpers and types used for the generic file manager.
 *
 * Each entry mirrors what we persist in the `files jsonb` column:
 * - id: storage object path or id
 * - link: public URL to the file
 * - name: optional human-friendly display name
 * - description: optional short description
 */
export type FileEntry = {
  id: string;
  link: string;
  name?: string | null;
  description?: string | null;
};

/** Type guard to validate a potential FileEntry at runtime. */
export function isFileEntry(x: unknown): x is FileEntry {
  if (!x || typeof x !== 'object') return false;
  const obj = x as Record<string, unknown>;
  return typeof obj.id === 'string' && typeof obj.link === 'string';
}

/** Normalize any unknown value into a FileEntry[] (dropping invalid items). */
export function normalizeFileArray(value: unknown): FileEntry[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isFileEntry) as FileEntry[];
}

