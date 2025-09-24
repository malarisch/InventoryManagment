
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using simple inputs instead of shadcn form/select for now
import { AssetTagTemplate } from '@/components/asset-tag-templates/types';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  width: z.number().min(1, 'Width must be at least 1'),
  height: z.number().min(1, 'Height must be at least 1'),
  elements: z.array(z.object({
    type: z.enum(['text', 'qrcode', 'barcode']),
    x: z.number(),
    y: z.number(),
    value: z.string(),
  })),
});

export function AssetTagTemplateCreateForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm<AssetTagTemplate>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      width: 100,
      height: 50,
      elements: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'elements',
  });

  const onSubmit = async (values: AssetTagTemplate) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) {
        throw new Error('User not authenticated');
      }

      // Get user's company
      const { data: userCompany, error: companyError } = await supabase
        .from('users_companies')
        .select('company_id')
        .eq('user_id', user.id)
        .single();

      if (companyError || !userCompany) {
        throw new Error('No company found for user');
      }

      // Create template
      const { data, error: insertError } = await supabase
        .from('asset_tag_templates')
        .insert({
          template: {
            name: values.name,
            width: values.width,
            height: values.height,
            elements: values.elements
          },
          company_id: userCompany.company_id,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('Template created successfully:', data);
      // Redirect to company settings or show success message
      router.push('/management/company-settings?tab=templates');
      
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <Input placeholder="My Template" {...form.register('name')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-1">Width (mm)</label>
          <Input type="number" {...form.register('width', { valueAsNumber: true })} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Height (mm)</label>
          <Input type="number" {...form.register('height', { valueAsNumber: true })} />
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium">Elements</h3>
        {fields.map((f, index) => (
          <div key={f.id} className="flex items-end gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium mb-1">Type</label>
              <select className="border rounded px-2 py-2" {...form.register(`elements.${index}.type` as const)}>
                <option value="text">Text</option>
                <option value="qrcode">QR Code</option>
                <option value="barcode">Barcode</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">X</label>
              <Input type="number" {...form.register(`elements.${index}.x` as const, { valueAsNumber: true })} />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Y</label>
              <Input type="number" {...form.register(`elements.${index}.y` as const, { valueAsNumber: true })} />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium mb-1">Value</label>
              <Input {...form.register(`elements.${index}.value` as const)} />
            </div>
            <Button type="button" variant="destructive" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ type: 'text', x: 0, y: 0, value: '' })}>
          Add Element
        </Button>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Template'}
      </Button>
    </form>
  );
}
