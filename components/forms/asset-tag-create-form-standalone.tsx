'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { AssetTagTemplate } from '@/components/asset-tag-templates/types';
import type { TablesInsert } from '@/database.types';
import { useEffect, useState } from 'react';
import { useCompany } from '@/app/management/_libs/companyHook';
import { useRouter } from 'next/navigation';

const formSchema = z.object({
  printed_code: z.string().min(1, 'Pflichtfeld'),
  printed_template: z.number().min(1, 'Bitte wählen Sie ein Template'),
});

export function AssetTagCreateFormStandalone() {
  const [templates, setTemplates] = useState<Array<{ id: number; template: AssetTagTemplate }>>([]);
  const [, setSelectedTemplate] = useState<AssetTagTemplate | null>(null);
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const router = useRouter();
  const { company } = useCompany();

  useEffect(() => {
    if (!company?.id) return;
    const fetchTemplates = async () => {
      const { data } = await supabase
        .from('asset_tag_templates')
        .select('id, template')
        .eq('company_id', company.id);
      setTemplates(((data as Array<{ id: number; template: AssetTagTemplate }> | null) ?? []).filter(Boolean));
    };
    fetchTemplates();
  }, [company?.id, supabase]);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      printed_code: '',
      printed_template: 0,
    },
  });

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!company?.id) return;
    
    setLoading(true);
    try {
      const payload: TablesInsert<'asset_tags'> = {
        printed_code: values.printed_code,
        printed_template: values.printed_template,
        company_id: company.id,
      };
      
      const { error } = await supabase.from('asset_tags').insert(payload).select().single();
      if (error) {
        console.error(error);
        return;
      }

      router.push('/management/asset-tags');
    } finally {
      setLoading(false);
    }
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
      // Remove template placeholders for standalone creation
      printedCode = printedCode.replace(/\{\{.*?\}\}/g, '');
      form.setValue('printed_code', printedCode);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      <Card className="md:col-span-6">
        <CardHeader>
          <CardTitle>Template auswählen</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="template">Template</Label>
          <select
            id="template"
            className="w-full rounded border px-3 py-2 mt-1"
            value={String(form.watch('printed_template') ?? '')}
            onChange={(e) => handleTemplateChange(e.target.value)}
            disabled={loading}
          >
            <option value="">Bitte wählen Sie ein Template</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id.toString()}>
                {template.template.name}
              </option>
            ))}
          </select>
          {form.formState.errors.printed_template && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.printed_template.message}</p>
          )}
        </CardContent>
      </Card>

      <Card className="md:col-span-6">
        <CardHeader>
          <CardTitle>Code</CardTitle>
        </CardHeader>
        <CardContent>
          <Label htmlFor="printed_code">Code</Label>
          <Input id="printed_code" {...form.register('printed_code')} disabled={loading} className="mt-1" />
          {form.formState.errors.printed_code && (
            <p className="text-red-500 text-sm mt-1">{form.formState.errors.printed_code.message}</p>
          )}
        </CardContent>
      </Card>

      <div className="col-span-full flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={() => router.push('/management/asset-tags')} disabled={loading}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? 'Wird erstellt...' : 'Asset Tag erstellen'}
        </Button>
      </div>
    </form>
  );
}