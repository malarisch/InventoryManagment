
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { AssetTagTemplate } from '@/components/asset-tag-templates/types';
import type { TablesInsert } from '@/database.types';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  printed_code: z.string().min(1, 'Pflichtfeld'),
  printed_template: z.number(),
});

export function AssetTagCreateForm({ item, table, companyId }: { item: { id: number, name: string }, table: string, companyId: number }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<Array<{ id: number; template: AssetTagTemplate }>>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AssetTagTemplate | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('asset_tag_templates')
        .select('id, template')
        .eq('company_id', companyId);
      setTemplates(((data as Array<{ id: number; template: AssetTagTemplate }> | null) ?? []).filter(Boolean));
    };
    fetchTemplates();
  }, [companyId, supabase]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const payload: TablesInsert<'asset_tags'> = {
      printed_code: values.printed_code,
      printed_template: values.printed_template,
    };
    const { data, error } = await supabase.from('asset_tags').insert(payload).select().single();
    if (error) {
      console.error(error);
      return;
    }

    await supabase.from(table).update({ asset_tag: data.id }).eq('id', item.id);
    setOpen(false);
  };

  const handleTemplateChange = (templateId: string) => {
    const tid = Number(templateId);
    const template = templates.find((t) => t.id === tid);
    if (template) {
      setSelectedTemplate(template.template);
      form.setValue('printed_template', template.id);
      // Prefill the form with data from the template
      const firstText = template.template.elements.find((e) => e.type === 'text');
      let printedCode = firstText?.value || '';
      printedCode = printedCode.replace('{{article.name}}', item.name);
      printedCode = printedCode.replace('{{article.id}}', item.id.toString());
      form.setValue('printed_code', printedCode);
    }
  };

  return (
    <div>
      <Button onClick={() => setOpen(true)}>Asset-Tag erstellen</Button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-lg bg-background border p-6 shadow-xl">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Create Asset Tag for {item.name}</h2>
              <Button variant="ghost" onClick={() => setOpen(false)}>×</Button>
            </div>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-1 text-foreground">Template</label>
                <select
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                  value={String(form.watch('printed_template') ?? '')}
                  onChange={(e) => handleTemplateChange(e.target.value)}
                >
                  <option value="">Select a template</option>
                  {templates.map((template) => (
                    <option key={template.id} value={template.id.toString()}>
                      {template.template.name}
                    </option>
                  ))}
                </select>
              </div>
              {selectedTemplate && (
                <div>
                  <label className="block text-sm font-medium mb-1 text-foreground">Printed Code</label>
                  <Input {...form.register('printed_code')} />
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Abbrechen</Button>
                <Button type="submit">Create</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
