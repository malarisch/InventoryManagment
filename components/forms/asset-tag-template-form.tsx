'use client';

import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { AssetTagTemplatePreview, DEFAULT_PREVIEW_DATA } from '@/components/asset-tag-templates/template-preview';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { createClient } from '@/lib/supabase/client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { AssetTagTemplate, AssetTagTemplateElement } from '@/components/asset-tag-templates/types';
import { useCompany } from '@/app/management/_libs/companyHook';

const MM_TO_PX = 3.779527559;

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
    textAlign: z.enum(['left', 'center', 'right']).optional(),
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
  const { company } = useCompany();
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
    if (!isEditMode || !company) return;
    
    async function fetchTemplate() {
      if (!company) return; // TypeScript guard
      
      const { data, error: fetchError } = await supabase
        .from('asset_tag_templates')
        .select('template, company_id')
        .eq('id', templateId)
        .eq('company_id', company.id)
        .single();
        
      if (fetchError || !data) {
        console.error('Failed to fetch template data', fetchError);
        setError('Template nicht gefunden oder gehört nicht zur aktuellen Company');
        setTimeout(() => router.push('/management/company-settings?tab=templates'), 2000);
      } else {
        const template = data.template as AssetTagTemplate;
        form.reset({
          ...template,
          elements: (template.elements || []).map((element) => ({
            ...element,
            textAlign: element.textAlign ?? 'left',
          })),
        } as unknown as FormValues);
      }
    }
    
    fetchTemplate();
  }, [isEditMode, templateId, supabase, router, form, company]);

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'elements',
  });

  const measurementCtxRef = useRef<CanvasRenderingContext2D | null>(null);

  const ensureMeasurementContext = useCallback(() => {
    if (typeof window === 'undefined') return null;
    if (!measurementCtxRef.current) {
      const canvas = document.createElement('canvas');
      measurementCtxRef.current = canvas.getContext('2d');
    }
    return measurementCtxRef.current;
  }, []);

  const getElementGeometry = useCallback((element: FormValues['elements'][number] | undefined) => {
    if (!element) return null;
    const ctx = element.type === 'text' ? ensureMeasurementContext() : null;
    const rawTextSize = form.getValues('textSizePt');
    const defaultTextSize = typeof rawTextSize === 'number' && !Number.isNaN(rawTextSize) ? rawTextSize : 12;
    const baseSizeCandidate = typeof element.size === 'number' && !Number.isNaN(element.size) ? element.size : undefined;
    const baseSize = baseSizeCandidate ?? defaultTextSize;

    let widthPx = 0;
    let heightPx = 0;
    let anchorShiftPx = 0;
    let baselineShiftPx = 0;

    if (element.type === 'text') {
      if (!ctx) return null;
      ctx.font = `${baseSize}px Arial, sans-serif`;
      const metrics = ctx.measureText(element.value ?? '');
      widthPx = metrics.width || 0;
      const ascentPx = metrics.actualBoundingBoxAscent ?? baseSize * 0.8;
      const descentPx = metrics.actualBoundingBoxDescent ?? baseSize * 0.2;
      heightPx = ascentPx + descentPx;
      anchorShiftPx = element.textAlign === 'center' ? widthPx / 2 : element.textAlign === 'right' ? widthPx : 0;
      baselineShiftPx = ascentPx;
    } else if (element.type === 'qrcode') {
      widthPx = baseSize * MM_TO_PX;
      heightPx = widthPx;
    } else if (element.type === 'image') {
      widthPx = baseSize * MM_TO_PX;
      const heightCandidate = typeof element.height === 'number' && !Number.isNaN(element.height) ? element.height : undefined;
      const targetHeight = heightCandidate ?? baseSize;
      heightPx = targetHeight * MM_TO_PX;
    } else if (element.type === 'barcode') {
      widthPx = baseSize * 2;
      heightPx = baseSize * 0.6 + 10;
    } else {
      widthPx = baseSize * MM_TO_PX;
      heightPx = widthPx;
    }

    const widthMm = widthPx / MM_TO_PX;
    const heightMm = heightPx / MM_TO_PX;
    const anchorShiftMm = anchorShiftPx / MM_TO_PX;
    const baselineShiftMm = baselineShiftPx / MM_TO_PX;
    const x = element.x ?? 0;
    const y = element.y ?? 0;
    const leftMm = x - anchorShiftMm;
    const topMm = y - baselineShiftMm;

    return {
      widthMm,
      heightMm,
      anchorShiftMm,
      baselineShiftMm,
      leftMm,
      topMm,
      rightMm: leftMm + widthMm,
      bottomMm: topMm + heightMm,
      centerMm: leftMm + widthMm / 2,
      middleMm: topMm + heightMm / 2,
    };
  }, [ensureMeasurementContext, form]);

  const [alignmentTargetsById, setAlignmentTargetsById] = useState<Record<string, string | null>>({});
  const watchedElements = form.watch('elements');
  const alignmentOptions = useMemo(() => {
    return fields.map((field, idx) => {
      const element = watchedElements?.[idx];
      const typeLabel = element?.type ? element.type.toUpperCase() : 'Element';
      const valueSnippet = element?.value ? ` – ${String(element.value).slice(0, 20)}${
        element?.value && element.value.length > 20 ? '…' : ''
      }` : '';
      return {
        id: field.id,
        idx,
        label: `#${idx + 1} ${typeLabel}${valueSnippet}`,
      };
    });
  }, [fields, watchedElements]);

  const handleAlignmentSelectChange = useCallback((fieldId: string, targetId: string) => {
    setAlignmentTargetsById((prev) => ({
      ...prev,
      [fieldId]: targetId.length ? targetId : null,
    }));
  }, []);

  const alignElementToTarget = useCallback((index: number, axis: 'x' | 'y') => {
    const field = fields[index];
    if (!field) return;
    const targetId = alignmentTargetsById[field.id];
    if (!targetId) return;
    const targetIndex = fields.findIndex((f) => f.id === targetId);
    if (targetIndex < 0) return;
    const targetElement = form.getValues(`elements.${targetIndex}` as const) as FormValues['elements'][number] | undefined;
    if (!targetElement) return;
    const value = axis === 'x' ? targetElement.x : targetElement.y;
    if (typeof value !== 'number' || Number.isNaN(value)) return;
    form.setValue(`elements.${index}.${axis}` as const, Number(value.toFixed(2)), {
      shouldDirty: true,
      shouldTouch: true,
    });
  }, [alignmentTargetsById, fields, form]);

  const alignElementToCanvas = useCallback(
    (index: number, axis: 'x' | 'y', position: 'start' | 'center' | 'end') => {
      const dimension = axis === 'x' ? form.getValues('tagWidthMm') : form.getValues('tagHeightMm');
      if (typeof dimension !== 'number' || Number.isNaN(dimension)) return;
      const element = form.getValues(`elements.${index}` as const) as FormValues['elements'][number] | undefined;
      const geometry = getElementGeometry(element);
      if (!element || !geometry) {
        const fallback = position === 'start' ? 0 : position === 'center' ? dimension / 2 : dimension;
        form.setValue(`elements.${index}.${axis}` as const, Number(fallback.toFixed(2)), {
          shouldDirty: true,
          shouldTouch: true,
        });
        return;
      }

      let newValue = element[axis] ?? 0;
      if (axis === 'x') {
        if (position === 'start') {
          newValue = geometry.anchorShiftMm;
        } else if (position === 'center') {
          newValue = dimension / 2 - geometry.widthMm / 2 + geometry.anchorShiftMm;
        } else {
          newValue = dimension - geometry.widthMm + geometry.anchorShiftMm;
        }
      } else {
        if (position === 'start') {
          newValue = geometry.baselineShiftMm;
        } else if (position === 'center') {
          newValue = dimension / 2 - geometry.heightMm / 2 + geometry.baselineShiftMm;
        } else {
          newValue = dimension - geometry.heightMm + geometry.baselineShiftMm;
        }
      }

      const clamped = Math.min(Math.max(newValue, 0), dimension);
      form.setValue(`elements.${index}.${axis}` as const, Number(clamped.toFixed(2)), {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [form, getElementGeometry],
  );

  const alignElementRelativeToTarget = useCallback(
    (index: number, axis: 'x' | 'y', position: 'start' | 'center' | 'end') => {
      const field = fields[index];
      if (!field) return;
      const targetId = alignmentTargetsById[field.id];
      if (!targetId) return;
      const targetIndex = fields.findIndex((f) => f.id === targetId);
      if (targetIndex < 0) return;

      const element = form.getValues(`elements.${index}` as const) as FormValues['elements'][number] | undefined;
      const targetElement = form.getValues(`elements.${targetIndex}` as const) as FormValues['elements'][number] | undefined;
      const geometry = getElementGeometry(element);
      const targetGeometry = getElementGeometry(targetElement);
      const dimension = axis === 'x' ? form.getValues('tagWidthMm') : form.getValues('tagHeightMm');

      if (!element || !geometry || !targetGeometry || typeof dimension !== 'number' || Number.isNaN(dimension)) {
        alignElementToTarget(index, axis);
        return;
      }

      let newValue = element[axis] ?? 0;
      if (axis === 'x') {
        if (position === 'start') {
          newValue = targetGeometry.leftMm + geometry.anchorShiftMm;
        } else if (position === 'center') {
          newValue = targetGeometry.centerMm - geometry.widthMm / 2 + geometry.anchorShiftMm;
        } else {
          newValue = targetGeometry.rightMm - geometry.widthMm + geometry.anchorShiftMm;
        }
      } else {
        if (position === 'start') {
          newValue = targetGeometry.topMm + geometry.baselineShiftMm;
        } else if (position === 'center') {
          newValue = targetGeometry.middleMm - geometry.heightMm / 2 + geometry.baselineShiftMm;
        } else {
          newValue = targetGeometry.bottomMm - geometry.heightMm + geometry.baselineShiftMm;
        }
      }

      const clamped = Math.min(Math.max(newValue, 0), dimension);
      form.setValue(`elements.${index}.${axis}` as const, Number(clamped.toFixed(2)), {
        shouldDirty: true,
        shouldTouch: true,
      });
    },
    [alignElementToTarget, alignmentTargetsById, fields, form, getElementGeometry],
  );

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
          textAlign: e.textAlign ?? 'left',
        })),
      };

      if (isEditMode) {
        // Update existing template
        if (!company) {
          throw new Error('No active company selected');
        }

        const { error: updateError } = await supabase
          .from('asset_tag_templates')
          .update({ template: templatePayload })
          .eq('id', templateId)
          .eq('company_id', company.id);

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

        if (!company) {
          throw new Error('No active company selected');
        }

        const { error: insertError } = await supabase
          .from('asset_tag_templates')
          .insert({
            template: templatePayload,
            company_id: company.id,
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
                <label htmlFor="name" className="block text-sm font-medium mb-1">Name</label>
                <Input id="name" placeholder="My Template" {...form.register('name')} />
              </div>
              <div>
                <label htmlFor="description" className="block text-sm font-medium mb-1">Description</label>
                <Input id="description" placeholder="Optional description" {...form.register('description')} />
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
                  <label htmlFor="tagWidthMm" className="block text-sm font-medium mb-1">Width (mm)</label>
                  <Input id="tagWidthMm" type="number" {...form.register('tagWidthMm', { valueAsNumber: true })} />
                </div>
                <div>
                  <label htmlFor="tagHeightMm" className="block text-sm font-medium mb-1">Height (mm)</label>
                  <Input id="tagHeightMm" type="number" {...form.register('tagHeightMm', { valueAsNumber: true })} />
                </div>
              </div>
              <div>
                <label htmlFor="marginMm" className="block text-sm font-medium mb-1">Margin (mm)</label>
                <Input id="marginMm" type="number" step="0.1" {...form.register('marginMm', { valueAsNumber: true })} />
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
              <label htmlFor="backgroundColor" className="block text-sm font-medium mb-1">Background Color</label>
              <Input id="backgroundColor" type="color" {...form.register('backgroundColor')} />
            </div>
            <div>
              <label htmlFor="textColor" className="block text-sm font-medium mb-1">Text Color</label>
              <Input id="textColor" type="color" {...form.register('textColor')} />
            </div>
            <div>
              <label htmlFor="borderColor" className="block text-sm font-medium mb-1">Border Color</label>
              <Input id="borderColor" type="color" {...form.register('borderColor')} />
            </div>
            <div>
              <label htmlFor="borderWidthMm" className="block text-sm font-medium mb-1">Border Width (mm)</label>
              <Input id="borderWidthMm" type="number" step="0.1" {...form.register('borderWidthMm', { valueAsNumber: true })} />
            </div>
            <div>
              <label htmlFor="textSizePt" className="block text-sm font-medium mb-1">Text Size (pt)</label>
              <Input id="textSizePt" type="number" {...form.register('textSizePt', { valueAsNumber: true })} />
            </div>
            <div className="flex items-center space-x-2">
              <input id="isMonochrome" type="checkbox" {...form.register('isMonochrome')} />
              <label htmlFor="isMonochrome" className="text-sm font-medium">Monochrome (Black & White)</label>
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
              <label htmlFor="prefix" className="block text-sm font-medium mb-1">Prefix</label>
              <Input id="prefix" placeholder="e.g., EQ" {...form.register('prefix')} />
            </div>
            <div>
              <label htmlFor="numberLength" className="block text-sm font-medium mb-1">Number Length</label>
              <Input id="numberLength" type="number" {...form.register('numberLength', { valueAsNumber: true })} />
            </div>
            <div>
              <label htmlFor="suffix" className="block text-sm font-medium mb-1">Suffix</label>
              <Input id="suffix" placeholder="e.g., A" {...form.register('suffix')} />
            </div>
            <div>
              <label htmlFor="numberingScheme" className="block text-sm font-medium mb-1">Numbering Scheme</label>
              <select id="numberingScheme" {...form.register('numberingScheme')} className="h-9 rounded-md border bg-background px-3 text-sm w-full">
                <option value="sequential">Sequential</option>
                <option value="random">Random</option>
              </select>
            </div>
            <div className="col-span-2">
              <label htmlFor="stringTemplate" className="block text-sm font-medium mb-1">String Template</label>
              <Input id="stringTemplate" placeholder="e.g., {prefix}{number}{suffix}" {...form.register('stringTemplate')} />
              <div className="mt-2 rounded-md border bg-muted/30 p-3 text-xs leading-relaxed">
                <div className="font-medium mb-1">Verfügbare Platzhalter</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1">
                  <div><code>{`{company-prefix}`}</code>: Firmenpräfix aus Metadaten</div>
                  <div><code>{`{entity-prefix}`}</code>: Template-Prefix (z. B. EQ)</div>
                  <div><code>{`{code}`}</code>: Nummer mit Padding (Länge)</div>
                  <div><code>{`{suffix}`}</code>: Template-Suffix</div>
                  <div><code>{`{company_name}`}</code>: Firmenname</div>
                </div>
                <div className="mt-2 text-muted-foreground">Beispiel: <code>{`{company-prefix}-{prefix}-{code}{suffix}`}</code> → <code>ACME-EQ-00042A</code></div>
              </div>
            </div>
            <div>
              <label htmlFor="codeType" className="block text-sm font-medium mb-1">Code Type</label>
              <select id="codeType" {...form.register('codeType')} className="h-9 rounded-md border bg-background px-3 text-sm w-full">
                <option value="QR">QR Code</option>
                <option value="Barcode">Barcode</option>
                <option value="None">None</option>
              </select>
            </div>
            <div>
              <label htmlFor="codeSizeMm" className="block text-sm font-medium mb-1">Code Size (mm)</label>
              <Input id="codeSizeMm" type="number" {...form.register('codeSizeMm', { valueAsNumber: true })} />
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
                    <label htmlFor={`elements-${index}-type`} className="block text-sm font-medium mb-1">Type</label>
                    <select id={`elements-${index}-type`} className="h-9 rounded-md border bg-background px-3 text-sm w-full" {...form.register(`elements.${index}.type` as const)}>
                      <option value="text">Text</option>
                      <option value="qrcode">QR Code</option>
                      <option value="barcode">Barcode</option>
                      <option value="image">Image</option>
                    </select>
                  </div>
                  <div>
                    <label htmlFor={`elements-${index}-x`} className="block text-sm font-medium mb-1">X Position (mm)</label>
                    <Input id={`elements-${index}-x`} type="number" step="0.01" {...form.register(`elements.${index}.x` as const, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label htmlFor={`elements-${index}-y`} className="block text-sm font-medium mb-1">Y Position (mm)</label>
                    <Input id={`elements-${index}-y`} type="number" step="0.01" {...form.register(`elements.${index}.y` as const, { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2">
                    <label htmlFor={`elements-${index}-value`} className="block text-sm font-medium mb-1">Value / Placeholder / Image URL</label>
                    <Input id={`elements-${index}-value`} placeholder="e.g., {equipment_name} or https://...img.png" {...form.register(`elements.${index}.value` as const)} />
                  </div>
                  <div>
                    <label htmlFor={`elements-${index}-size`} className="block text-sm font-medium mb-1">Size</label>
                    <Input id={`elements-${index}-size`} type="number" placeholder="Font/code/image width" {...form.register(`elements.${index}.size` as const, { valueAsNumber: true })} />
                  </div>
                  <div>
                    <label htmlFor={`elements-${index}-height`} className="block text-sm font-medium mb-1">Height (image)</label>
                    <Input id={`elements-${index}-height`} type="number" placeholder="Only for image" {...form.register(`elements.${index}.height` as const, { valueAsNumber: true })} />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-end">
                  <div className="flex items-end gap-4">
                    <div>
                      <label htmlFor={`elements-${index}-color`} className="block text-sm font-medium mb-1">Color Override</label>
                      <Input id={`elements-${index}-color`} type="color" {...form.register(`elements.${index}.color` as const)} />
                    </div>
                    {form.watch(`elements.${index}.type`) === 'text' ? (
                      <div>
                        <label htmlFor={`elements-${index}-textAlign`} className="block text-sm font-medium mb-1">Text Alignment</label>
                        <select
                          id={`elements-${index}-textAlign`}
                          className="h-9 rounded-md border bg-background px-3 text-sm w-full"
                          {...form.register(`elements.${index}.textAlign` as const)}
                        >
                          <option value="left">Links</option>
                          <option value="center">Zentriert</option>
                          <option value="right">Rechts</option>
                        </select>
                      </div>
                    ) : null}
                  </div>
                  <div className="flex justify-end md:justify-end">
                    <Button type="button" variant="destructive" onClick={() => remove(index)}>
                      Remove Element
                    </Button>
                  </div>
                </div>
                {alignmentOptions.length > 1 ? (
                  <div className="flex flex-wrap items-end gap-3">
                    <div>
                      <label htmlFor={`elements-${index}-align-target`} className="block text-sm font-medium mb-1">Ausrichten an</label>
                      <select
                        id={`elements-${index}-align-target`}
                        className="h-9 rounded-md border bg-background px-3 text-sm w-full"
                        value={alignmentTargetsById[f.id] ?? ''}
                        onChange={(event) => handleAlignmentSelectChange(f.id, event.target.value)}
                      >
                        <option value="">Referenz wählen…</option>
                        {alignmentOptions
                          .filter((option) => option.id !== f.id)
                          .map((option) => (
                            <option key={option.id} value={option.id}>
                              {option.label}
                            </option>
                          ))}
                      </select>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!alignmentTargetsById[f.id]}
                        onClick={() => alignElementToTarget(index, 'x')}
                      >
                        X angleichen
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        disabled={!alignmentTargetsById[f.id]}
                        onClick={() => alignElementToTarget(index, 'y')}
                      >
                        Y angleichen
                      </Button>
                    </div>
                    {alignmentTargetsById[f.id] ? (
                      <div className="flex flex-wrap gap-3">
                        <div className="space-y-2">
                          <span className="block text-sm font-medium">Relative Ausrichtung (X)</span>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => alignElementRelativeToTarget(index, 'x', 'start')}>
                              Links
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => alignElementRelativeToTarget(index, 'x', 'center')}>
                              Mitte
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => alignElementRelativeToTarget(index, 'x', 'end')}>
                              Rechts
                            </Button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <span className="block text-sm font-medium">Relative Ausrichtung (Y)</span>
                          <div className="flex gap-2">
                            <Button type="button" variant="outline" size="sm" onClick={() => alignElementRelativeToTarget(index, 'y', 'start')}>
                              Oben
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => alignElementRelativeToTarget(index, 'y', 'center')}>
                              Mitte
                            </Button>
                            <Button type="button" variant="outline" size="sm" onClick={() => alignElementRelativeToTarget(index, 'y', 'end')}>
                              Unten
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : null}
                  </div>
                ) : null}
                <div className="flex flex-wrap items-end gap-3">
                  <div className="space-y-2">
                    <span className="block text-sm font-medium">Canvas-Ausrichtung (X)</span>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => alignElementToCanvas(index, 'x', 'start')}>
                        Links
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => alignElementToCanvas(index, 'x', 'center')}>
                        Mitte
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => alignElementToCanvas(index, 'x', 'end')}>
                        Rechts
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <span className="block text-sm font-medium">Canvas-Ausrichtung (Y)</span>
                    <div className="flex gap-2">
                      <Button type="button" variant="outline" size="sm" onClick={() => alignElementToCanvas(index, 'y', 'start')}>
                        Oben
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => alignElementToCanvas(index, 'y', 'center')}>
                        Mitte
                      </Button>
                      <Button type="button" variant="outline" size="sm" onClick={() => alignElementToCanvas(index, 'y', 'end')}>
                        Unten
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={() => append({ type: 'text', x: 0, y: 0, value: '', size: 12, textAlign: 'left' })}>
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
                  textAlign: e.textAlign,
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
                    <code className="bg-muted px-2 py-1 rounded">{'{general_name}'}</code>
                    <span className="text-muted-foreground">General Name</span>
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
