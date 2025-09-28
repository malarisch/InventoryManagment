
'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AssetTagTemplatePreview } from '@/components/asset-tag-templates/template-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
// Using simple inputs instead of shadcn form/select for now
import { AssetTagTemplate, AssetTagTemplateElement } from '@/components/asset-tag-templates/types';

const preprocessOptionalNumber = (min?: number) =>
  z.preprocess((v) => {
    if (v === '' || v === null || (typeof v === 'number' && Number.isNaN(v))) return undefined;
    return v;
  }, (min !== undefined ? z.number().min(min) : z.number()).optional());

const formSchema = z.object({
  // Basic info
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  
  // Physical dimensions
  tagWidthMm: z.number().min(1, 'Width must be at least 1'),
  tagHeightMm: z.number().min(1, 'Height must be at least 1'),
  marginMm: preprocessOptionalNumber(0),
  
  // Visual styling
  backgroundColor: z.string().optional(),
  textColor: z.string().optional(),
  borderColor: z.string().optional(),
  borderWidthMm: preprocessOptionalNumber(0),
  textSizePt: preprocessOptionalNumber(1),
  isMonochrome: z.boolean().optional(),
  
  // Code generation
  prefix: z.string().optional(),
  numberLength: preprocessOptionalNumber(1),
  suffix: z.string().optional(),
  numberingScheme: z.enum(['sequential', 'random']).optional(),
  stringTemplate: z.string().optional(),
  codeType: z.enum(['QR', 'Barcode', 'None']).optional(),
  codeSizeMm: preprocessOptionalNumber(1),
  
  // Elements
  elements: z.array(z.object({
    type: z.enum(['text', 'qrcode', 'barcode', 'image']),
    x: z.number(),
    y: z.number(),
    value: z.string(),
  size: preprocessOptionalNumber(1),
  height: preprocessOptionalNumber(1),
    color: z.string().optional(),
  })),
});

type FormValues = z.infer<typeof formSchema>;

export function AssetTagTemplateCreateForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();

  const form = useForm({
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

  const onSubmit = async (raw: unknown) => {
    const values = raw as FormValues; // zodResolver guarantees shape
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
        throw companyError || new Error('User has no associated company');
      }

      // Create template
      // Map form values (which may have undefined optional numeric fields) directly; types align with AssetTagTemplate
      const templatePayload: AssetTagTemplate = {
        name: values.name,
        description: values.description,
        tagWidthMm: values.tagWidthMm,
        tagHeightMm: values.tagHeightMm,
        marginMm: values.marginMm as number | undefined,
        backgroundColor: values.backgroundColor,
        textColor: values.textColor,
        borderColor: values.borderColor,
        borderWidthMm: values.borderWidthMm as number | undefined,
        textSizePt: values.textSizePt as number | undefined,
        isMonochrome: values.isMonochrome,
        prefix: values.prefix,
        numberLength: values.numberLength as number | undefined,
        suffix: values.suffix,
        numberingScheme: values.numberingScheme,
        stringTemplate: values.stringTemplate,
        codeType: values.codeType,
        codeSizeMm: values.codeSizeMm as number | undefined,
        elements: values.elements.map(e => ({
          ...e,
          size: e.size as number | undefined,
          height: e.height as number | undefined,
        })),
      };

      const { data, error: insertError } = await supabase
        .from('asset_tag_templates')
        .insert({
          template: templatePayload,
          company_id: userCompany.company_id,
          created_by: user.id
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      console.log('Template created successfully:', data);
      // Robust redirect after success
      const target = '/management/company-settings?tab=templates';
      try {
        router.push(target);
        // Fallback in case client-side navigation is blocked
        setTimeout(() => {
          if (typeof window !== 'undefined' && !window.location.href.includes('/management/company-settings')) {
            window.location.assign(target);
          }
        }, 250);
      } catch {
        if (typeof window !== 'undefined') window.location.assign(target);
      }
      
    } catch (err) {
      console.error('Error creating template:', err);
      setError(err instanceof Error ? err.message : 'Failed to create template');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 md:grid-cols-12 gap-6">
      {error && (
        <Card className="col-span-full border-red-200">
          <CardContent className="bg-red-50 text-red-700 px-4 py-3">{error}</CardContent>
        </Card>
      )}
      
      {/* Basic Information */}
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Basic Information</CardTitle>
          <CardDescription>Template name and description</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <Input placeholder="My Template" {...form.register('name')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <Input placeholder="Optional description" {...form.register('description')} />
          </div>
        </CardContent>
      </Card>

      {/* Dimensions */}
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Dimensions</CardTitle>
          <CardDescription>Physical size and margins</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      {/* Styling */}
      <Card className="md:col-span-4">
        <CardHeader>
          <CardTitle>Styling</CardTitle>
          <CardDescription>Colors and typography</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
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
        </CardContent>
      </Card>

      {/* Code Generation */}
      <Card className="md:col-span-6">
        <CardHeader>
          <CardTitle>Code Generation</CardTitle>
          <CardDescription>Build printed_code from rules</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-2 gap-4">
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
            <select {...form.register('numberingScheme')} className="h-9 rounded-md border bg-background px-3 text-sm w-full">
              <option value="sequential">Sequential</option>
              <option value="random">Random</option>
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-sm font-medium mb-1">String Template</label>
            <Input placeholder="e.g., {prefix}{number}{suffix}" {...form.register('stringTemplate')} />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code Type</label>
            <select {...form.register('codeType')} className="h-9 rounded-md border bg-background px-3 text-sm w-full">
              <option value="QR">QR Code</option>
              <option value="Barcode">Barcode</option>
              <option value="None">None</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Code Size (mm)</label>
            <Input type="number" {...form.register('codeSizeMm', { valueAsNumber: true })} />
          </div>
        </CardContent>
      </Card>

      {/* Elements */}
      <Card className="md:col-span-12">
        <CardHeader>
          <CardTitle>Elements</CardTitle>
          <CardDescription>Add and configure template elements</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((f, index) => (
            <div key={f.id} className="border border-dashed rounded-md p-4 space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Type</label>
                  <select className="h-9 rounded-md border bg-background px-3 text-sm w-full" {...form.register(`elements.${index}.type` as const)}>
                    <option value="text">Text</option>
                    <option value="qrcode">QR Code</option>
                    <option value="barcode">Barcode</option>
                    <option value="image">Image</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">X Position (mm)</label>
                  <Input type="number" step="0.01" {...form.register(`elements.${index}.x` as const, { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Y Position (mm)</label>
                  <Input type="number" step="0.01" {...form.register(`elements.${index}.y` as const, { valueAsNumber: true })} />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2">
                  <label className="block text-sm font-medium mb-1">Value / Placeholder / Image URL</label>
                  <Input placeholder="e.g., {equipment_name} or https://...img.png" {...form.register(`elements.${index}.value` as const)} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Size</label>
                  <Input type="number" placeholder="Font/code/image width" {...form.register(`elements.${index}.size` as const, { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height (image)</label>
                  <Input type="number" placeholder="Only for image" {...form.register(`elements.${index}.height` as const, { valueAsNumber: true })} />
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
        </CardContent>
      </Card>

      {/* Live Preview */}
      <Card className="md:col-span-6 md:sticky md:top-20">
        <CardHeader>
          <CardTitle>Live Preview</CardTitle>
          <CardDescription>Drag to arrange elements</CardDescription>
        </CardHeader>
        <CardContent>
          {(() => {
            const w = form.watch();
            const previewTemplate: AssetTagTemplate = {
              name: w.name,
              description: w.description,
              tagWidthMm: w.tagWidthMm,
              tagHeightMm: w.tagHeightMm,
              marginMm: w.marginMm as number | undefined,
              backgroundColor: w.backgroundColor,
              textColor: w.textColor,
              borderColor: w.borderColor,
              borderWidthMm: w.borderWidthMm as number | undefined,
              textSizePt: w.textSizePt as number | undefined,
              isMonochrome: w.isMonochrome,
              prefix: w.prefix,
              numberLength: w.numberLength as number | undefined,
              suffix: w.suffix,
              numberingScheme: w.numberingScheme,
              stringTemplate: w.stringTemplate,
              codeType: w.codeType,
              codeSizeMm: w.codeSizeMm as number | undefined,
              elements: (w.elements || []).map(e => ({
                ...e,
                size: e.size as number | undefined,
                height: e.height as number | undefined,
              })),
            };
            return (
              <AssetTagTemplatePreview
                template={previewTemplate}
                editable
                onElementsChange={(els: AssetTagTemplateElement[]) =>
                  form.setValue('elements', els as unknown as FormValues['elements'], { shouldDirty: true, shouldTouch: true })
                }
              />
            );
          })()}
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="md:col-span-12 flex justify-end">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? 'Creating...' : 'Create Template'}
        </Button>
      </div>
    </form>
  );
}
