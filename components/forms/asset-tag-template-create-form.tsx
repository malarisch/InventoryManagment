
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AssetTagTemplatePreview } from '@/components/asset-tag-templates/template-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using simple inputs instead of shadcn form/select for now
import { AssetTagTemplate } from '@/components/asset-tag-templates/types';

const formSchema = z.object({
  // Basic info
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  
  // Physical dimensions
  tagWidthMm: z.number().min(1, 'Width must be at least 1'),
  tagHeightMm: z.number().min(1, 'Height must be at least 1'),
  marginMm: z.number().min(0).optional(),
  
  // Visual styling
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidthMm: z.number().min(0).optional(),
  textSizePt: z.number().min(1).optional(),
  isMonochrome: z.boolean().optional(),
  
  // Code generation
  prefix: z.string().optional(),
  numberLength: z.number().min(1).optional(),
  suffix: z.string().optional(),
  numberingScheme: z.enum(['sequential', 'random']).optional(),
  stringTemplate: z.string().optional(),
  codeType: z.enum(['QR', 'Barcode', 'None']).optional(),
  codeSizeMm: z.number().min(1).optional(),
  
  // Elements
  elements: z.array(z.object({
    type: z.enum(['text', 'qrcode', 'barcode']),
    x: z.number(),
    y: z.number(),
    value: z.string(),
    size: z.number().min(1).optional(),
    color: z.string().optional(),
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
      description: '',
      tagWidthMm: 100,
      tagHeightMm: 50,
      marginMm: 2,
      textSizePt: 12,
      isMonochrome: false,
      numberLength: 4,
      numberingScheme: 'sequential',
      codeType: 'QR',
      codeSizeMm: 15,
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
            description: values.description,
            tagWidthMm: values.tagWidthMm,
            tagHeightMm: values.tagHeightMm,
            marginMm: values.marginMm,
            backgroundColor: values.backgroundColor,
            textColor: values.textColor,
            borderColor: values.borderColor,
            borderWidthMm: values.borderWidthMm,
            textSizePt: values.textSizePt,
            isMonochrome: values.isMonochrome,
            prefix: values.prefix,
            numberLength: values.numberLength,
            suffix: values.suffix,
            numberingScheme: values.numberingScheme,
            stringTemplate: values.stringTemplate,
            codeType: values.codeType,
            codeSizeMm: values.codeSizeMm,
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
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Basic Information</h3>
        <div>
          <label className="block text-sm font-medium mb-1">Name</label>
          <Input placeholder="My Template" {...form.register('name')} />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Description</label>
          <Input placeholder="Optional description" {...form.register('description')} />
        </div>
      </div>

      {/* Dimensions */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Dimensions</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Width (mm)</label>
            <Input type="number" {...form.register('tagWidthMm', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Height (mm)</label>
            <Input type="number" {...form.register('tagHeightMm', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Margin (mm)</label>
            <Input type="number" step="0.1" {...form.register('marginMm', { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      {/* Styling */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Styling</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Background Color</label>
            <Input type="color" {...form.register('backgroundColor')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Text Color</label>
            <Input type="color" {...form.register('textColor')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Border Color</label>
            <Input type="color" {...form.register('borderColor')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Border Width (mm)</label>
            <Input type="number" step="0.1" {...form.register('borderWidthMm', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Text Size (pt)</label>
            <Input type="number" {...form.register('textSizePt', { valueAsNumber: true })} />
          </div>
          <div className="flex items-center space-x-2">
            <input type="checkbox" {...form.register('isMonochrome')} />
            <label className="text-sm font-medium">Monochrome (Black & White)</label>
          </div>
        </div>
      </div>

      {/* Code Generation */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Code Generation</h3>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Prefix</label>
            <Input placeholder="e.g., EQ" {...form.register('prefix')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Number Length</label>
            <Input type="number" {...form.register('numberLength', { valueAsNumber: true })} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Suffix</label>
            <Input placeholder="e.g., A" {...form.register('suffix')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Numbering Scheme</label>
            <select {...form.register('numberingScheme')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="sequential">Sequential</option>
              <option value="random">Random</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">String Template</label>
            <Input placeholder="e.g., {prefix}-{number}-{suffix}" {...form.register('stringTemplate')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code Type</label>
            <select {...form.register('codeType')} className="w-full px-3 py-2 border border-gray-300 rounded-md">
              <option value="QR">QR Code</option>
              <option value="Barcode">Barcode</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code Size (mm)</label>
            <Input type="number" {...form.register('codeSizeMm', { valueAsNumber: true })} />
          </div>
        </div>
      </div>

      {/* Elements */}
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Elements</h3>
        {fields.map((f, index) => (
          <div key={f.id} className="border border-gray-200 p-4 rounded-md space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-md" {...form.register(`elements.${index}.type` as const)}>
                  <option value="text">Text</option>
                  <option value="qrcode">QR Code</option>
                  <option value="barcode">Barcode</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">X Position</label>
                <Input type="number" {...form.register(`elements.${index}.x` as const, { valueAsNumber: true })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Y Position</label>
                <Input type="number" {...form.register(`elements.${index}.y` as const, { valueAsNumber: true })} />
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <label className="block text-sm font-medium mb-1">Value/Placeholder</label>
                <Input placeholder="e.g., {equipment_name} or static text" {...form.register(`elements.${index}.value` as const)} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Size</label>
                <Input type="number" placeholder="Font size or code size" {...form.register(`elements.${index}.size` as const, { valueAsNumber: true })} />
              </div>
            </div>
            <div className="flex items-end justify-between">
              <div>
                <label className="block text-sm font-medium mb-1">Color Override</label>
                <Input type="color" {...form.register(`elements.${index}.color` as const)} />
              </div>
              <Button type="button" variant="destructive" onClick={() => remove(index)}>
                Remove Element
              </Button>
            </div>
          </div>
        ))}
        <Button type="button" variant="outline" onClick={() => append({ type: 'text', x: 0, y: 0, value: '', size: 12 })}>
          Add Element
        </Button>
      </div>

      {/* Template Preview */}
      <AssetTagTemplatePreview template={form.watch()} />

      <Button type="submit" disabled={isLoading}>
        {isLoading ? 'Creating...' : 'Create Template'}
      </Button>
    </form>
  );
}
