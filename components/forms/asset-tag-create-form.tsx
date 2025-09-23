
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { AssetTagTemplate } from '@/components/asset-tag-templates/types';
import { useEffect, useState } from 'react';

const formSchema = z.object({
  printed_code: z.string(),
  printed_template: z.bigint(),
});

export function AssetTagCreateForm({ item, table, companyId }: { item: { id: number, name: string }, table: string, companyId: number }) {
  const [open, setOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<AssetTagTemplate | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchTemplates = async () => {
      const { data } = await supabase.from('asset_tag_templates').select('*').eq('company_id', companyId);
      setTemplates(data || []);
    };
    fetchTemplates();
  }, [companyId, supabase]);

  const form = useForm({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (values: any) => {
    const { data, error } = await supabase.from('asset_tags').insert(values).select().single();
    if (error) {
      console.error(error);
      return;
    }

    await supabase.from(table).update({ asset_tag: data.id }).eq('id', item.id);
    setOpen(false);
  };

  const handleTemplateChange = (templateId: string) => {
    const template = templates.find((t) => t.id === BigInt(templateId));
    if (template) {
      setSelectedTemplate(template.template);
      form.setValue('printed_template', template.id);
      // Prefill the form with data from the template
      let printedCode = template.template.elements.find((e: any) => e.type === 'text')?.value || '';
      printedCode = printedCode.replace('{{article.name}}', item.name);
      printedCode = printedCode.replace('{{article.id}}', item.id.toString());
      form.setValue('printed_code', printedCode);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Asset-Tag erstellen</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Asset Tag for {item.name}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="printed_template"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Template</FormLabel>
                  <select onChange={(e) => handleTemplateChange(e.target.value)}>
                    <option value="">Select a template</option>
                    {templates.map((template) => (
                      <option key={template.id} value={template.id.toString()}>
                        {template.template.name}
                      </option>
                    ))}
                  </select>
                  <FormMessage />
                </FormItem>
              )}
            />
            {selectedTemplate && (
              <FormField
                control={form.control}
                name="printed_code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Printed Code</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
            <Button type="submit">Create</Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
