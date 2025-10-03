'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AssetTagTemplatePreview, DEFAULT_PREVIEW_DATA } from '@/components/asset-tag-templates/template-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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

interface AssetTagTemplateFormProps {
  /** If provided, form operates in edit mode; otherwise in create mode */
  templateId?: number;
}

/**
 * Unified form component for creating and editing asset tag templates.
 * 
 * Features:
 * - 3-column responsive layout with cards for organized input sections
 * - Live preview with drag-and-drop element positioning
 * - Template codes reference card
 * - Auto-loads existing template data when templateId is provided
 * 
 * @param templateId - Optional ID for edit mode. If omitted, creates new template.
 */
export function AssetTagTemplateForm({ templateId }: AssetTagTemplateFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const supabase = createClient();
  const isEditMode = templateId !== undefined;

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
      numberingScheme: 'sequential' as const,
      codeType: 'QR' as const,
      codeSizeMm: 15,
      elements: [],
    },
  });

  // Load existing template data in edit mode
  useEffect(() => {
    if (!isEditMode) return;
    
    async function fetchTemplate() {
      const { data, error: fetchError } = await supabase
        .from('asset_tag_templates')
        .select('template')
        .eq('id', templateId)
        .single();
        
      if (fetchError || !data) {
        console.error('Failed to fetch template data', fetchError);
        setError('Template nicht gefunden');
        setTimeout(() => router.push('/management/company-settings?tab=templates'), 2000);
      } else {
        form.reset(data.template as unknown as FormValues);
      }
    }
    
    fetchTemplate();
  }, [isEditMode, templateId, supabase, router, form]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'elements',
  });

  const onSubmit = async (raw: unknown) => {
    const values = raw as FormValues;
    setIsLoading(true);
    setError(null);
    
    try {
      // Build template payload
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

      if (isEditMode) {
        // Update existing template
        const { error: updateError } = await supabase
          .from('asset_tag_templates')
          .update({ template: templatePayload })
          .eq('id', templateId);

        if (updateError) {
          throw updateError;
        }

        console.log('Template updated successfully');
      } else {
        // Create new template
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError || !user) {
          throw new Error('User not authenticated');
        }

        // Get user's company
        const { data: membership, error: companyError } = await supabase
          .from('users_companies')
          .select('company_id, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (companyError || !membership) {
          throw companyError || new Error('User has no associated company');
        }

        const { error: insertError } = await supabase
          .from('asset_tag_templates')
          .insert({
            template: templatePayload,
            company_id: membership.company_id,
            created_by: user.id
          });

        if (insertError) {
          throw insertError;
        }

        console.log('Template created successfully');
      }

      // Navigate back to templates list
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
      console.error(`Error ${isEditMode ? 'updating' : 'creating'} template:`, err);
      setError(err instanceof Error ? err.message : `Failed to ${isEditMode ? 'update' : 'create'} template`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      <form onSubmit={form.handleSubmit(onSubmit)} className="lg:col-span-8 space-y-6">
        {error && (
          <Card className="border-red-200">
            <CardContent className="bg-red-50 text-red-700 px-4 py-3">{error}</CardContent>
          </Card>
        )}
        
        {/* Two column layout for smaller cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Basic Information */}
          <Card>
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
          <Card>
            <CardHeader>
              <CardTitle>Dimensions</CardTitle>
              <CardDescription>Physical size and margins</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1">Width (mm)</label>
                  <Input type="number" {...form.register('tagWidthMm', { valueAsNumber: true })} />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Height (mm)</label>
                  <Input type="number" {...form.register('tagHeightMm', { valueAsNumber: true })} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Margin (mm)</label>
                <Input type="number" step="0.1" {...form.register('marginMm', { valueAsNumber: true })} />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Styling - Full width */}
        <Card>
          <CardHeader>
            <CardTitle>Styling</CardTitle>
            <CardDescription>Colors and typography</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
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

        {/* Code Generation - Full width */}
        <Card>
          <CardHeader>
            <CardTitle>Code Generation</CardTitle>
            <CardDescription>Build printed_code from rules</CardDescription>
          </CardHeader>
          <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4">
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
        <Card>
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

        {/* Actions */}
        <div className="flex justify-end gap-3">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (isEditMode ? 'Updating...' : 'Creating...') : (isEditMode ? 'Update Template' : 'Create Template')}
          </Button>
        </div>
      </form>

      {/* Live Preview and Template Codes - Sticky on large screens */}
      <div className="lg:col-span-4">
        <div className="lg:sticky lg:top-20 space-y-6">
          <Card>
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

          {/* Available Template Codes */}
          <Card>
            <CardHeader>
              <CardTitle>Available Template Codes</CardTitle>
              <CardDescription>Use these placeholders in element values</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{printed_code}'}</code>
                    <span className="text-muted-foreground">Asset Tag Code</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.printed_code}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{equipment_name}'}</code>
                    <span className="text-muted-foreground">Equipment Name</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.equipment_name}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{article_name}'}</code>
                    <span className="text-muted-foreground">Article Name</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.article_name}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{location_name}'}</code>
                    <span className="text-muted-foreground">Location Name</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.location_name}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{case_name}'}</code>
                    <span className="text-muted-foreground">Case Name</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.case_name}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{company_name}'}</code>
                    <span className="text-muted-foreground">Company Name</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.company_name}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{current_date}'}</code>
                    <span className="text-muted-foreground">Current Date</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.current_date}</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <code className="bg-muted px-2 py-1 rounded">{'{qr_url}'}</code>
                    <span className="text-muted-foreground">QR Code URL</span>
                  </div>
                  <div className="text-muted-foreground ml-2">→ {DEFAULT_PREVIEW_DATA.qr_url}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
