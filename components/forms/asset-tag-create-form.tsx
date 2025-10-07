
'use client';

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { AssetTagTemplate } from '@/components/asset-tag-templates/types';
import type { TablesInsert } from '@/database.types';
import { useEffect, useState } from 'react';
import { buildAssetTagCode, defaultTemplateId, type AssetTagEntityType } from '@/lib/asset-tags/code';
import type { adminCompanyMetadata, asset_tag_template_print } from '@/components/metadataTypes.types';

const tableToEntityType: Record<string, AssetTagEntityType> = {
  articles: "article",
  equipments: "equipment",
  cases: "case",
  locations: "location",
};

export function AssetTagCreateForm({ item, table, companyId }: { item: { id: number, name: string }, table: string, companyId: number }) {
  const [busy, setBusy] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: number; template: AssetTagTemplate }>>([]);
  const [companyMeta, setCompanyMeta] = useState<adminCompanyMetadata | null>(null);
  const [companyName, setCompanyName] = useState<string>("");
  const supabase = createClient();

  const entityType = tableToEntityType[table] || "equipment";

  useEffect(() => {
    const fetchData = async () => {
      const [templatesRes, companyRes] = await Promise.all([
        supabase.from('asset_tag_templates').select('id, template').eq('company_id', companyId),
        supabase.from('companies').select('name, metadata').eq('id', companyId).single(),
      ]);
      const templateData = ((templatesRes.data as Array<{ id: number; template: AssetTagTemplate }> | null) ?? []).filter(Boolean);
      setTemplates(templateData);
      const meta = (companyRes.data?.metadata as adminCompanyMetadata) ?? null;
      setCompanyMeta(meta);
      setCompanyName((companyRes.data?.name as string) ?? "");
    };
    fetchData();
  }, [companyId, supabase]);

  const createTag = async () => {
    if (busy) return;
    setBusy(true);
    try {
      const defaultId = companyMeta ? defaultTemplateId(companyMeta, entityType) : undefined;
      const chosen = templates.find((t) => t.id === defaultId) || templates[0];
      if (!chosen) throw new Error('Kein Asset-Tag-Template vorhanden');

      const templatePrint: asset_tag_template_print = {
        name: chosen.template.name,
        description: chosen.template.description || '',
        prefix: chosen.template.prefix || '',
        suffix: chosen.template.suffix || '',
        numberLength: chosen.template.numberLength || 0,
        numberingScheme: chosen.template.numberingScheme || 'sequential',
        stringTemplate: chosen.template.stringTemplate || '{prefix}-{code}',
        codeType: chosen.template.codeType || 'QR',
      };
      const code = companyMeta
        ? buildAssetTagCode(companyMeta, entityType, item.id, templatePrint, { company_name: companyName })
        : String(item.id);

      const payload: TablesInsert<'asset_tags'> = {
        printed_code: code,
        printed_template: chosen.id,
        company_id: companyId,
      };
      const { data, error } = await supabase.from('asset_tags').insert(payload).select().single();
      if (error) throw error;
      await supabase.from(table).update({ asset_tag: (data as { id: number }).id }).eq('id', item.id);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Button onClick={createTag} disabled={busy}>{busy ? 'Erstelle…' : 'Asset-Tag erstellen'}</Button>
  );
}
