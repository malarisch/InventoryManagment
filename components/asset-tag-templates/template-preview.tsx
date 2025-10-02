'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { AssetTagTemplate, AssetTagTemplateElement } from '@/components/asset-tag-templates/types';
import { generateSVG } from '@/lib/asset-tags/svg-generator';
import { Button } from '@/components/ui/button';
import { Maximize2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface AssetTagTemplatePreviewProps {
  template: AssetTagTemplate;
  /** When true elements become draggable and onElementsChange will be called */
  editable?: boolean;
  /** Callback with updated elements after drag */
  onElementsChange?: (elements: AssetTagTemplateElement[]) => void;
  /** Maximum width for canvas scaling (default: 400) */
  maxWidth?: number;
}

// px per mm (approx 96 dpi)
const MM_TO_PX = 3.779527559;

export function AssetTagTemplatePreview({ template, editable = false, onElementsChange, maxWidth = 400 }: AssetTagTemplatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null); // for selection boxes
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOffset = useRef<{dx: number; dy: number}>({ dx: 0, dy: 0 });
  const [modalOpen, setModalOpen] = useState(false);

  // Sample placeholder data for preview – keep consistent with previous implementation
  const previewData = useMemo(() => ({
    printed_code: 'EQ001',
    equipment_name: 'Camera Sony FX6',
    article_name: 'Professional Camera',
    location_name: 'Studio A',
  }), []);

  const widthPx = template.tagWidthMm * MM_TO_PX;
  const heightPx = template.tagHeightMm * MM_TO_PX;
  const marginPx = (template.marginMm || 0) * MM_TO_PX;

  // Calculate scale to fit within maxWidth while maintaining aspect ratio
  const scale = useMemo(() => {
    if (widthPx <= maxWidth) return 1;
    return maxWidth / widthPx;
  }, [widthPx, maxWidth]);

  const displayWidth = widthPx * scale;
  const displayHeight = heightPx * scale;

  const elements: AssetTagTemplateElement[] = useMemo(()=> template.elements || [], [template.elements]);

  // Async generated SVG string - now client-side only for instant updates during drag
  const [svgContent, setSvgContent] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        // Direct client-side generation for instant preview updates
        const svg = await generateSVG(template, previewData);
        if (!cancelled) setSvgContent(svg);
      } catch (e) {
        console.error('Client-side preview generation failed', e);
        if (!cancelled) setSvgContent(''); // Clear on error
      }
    })();
    return () => { cancelled = true; };
  }, [template, previewData]);

  // Draw the SVG onto the base canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = widthPx;
    canvas.height = heightPx;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, widthPx, heightPx);
      ctx.drawImage(img, 0, 0);
      URL.revokeObjectURL(url);
      drawOverlay();
    };
    img.src = url;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [svgContent, widthPx, heightPx, editable, scale]);

  // Bounding box calculation helper (minimal logic duplication just for interaction layer)
  const measureElement = useCallback((ctx: CanvasRenderingContext2D, el: AssetTagTemplateElement) => {
    const size = el.size || template.textSizePt || 12;
    if (el.type === 'text') {
      ctx.font = `${size}px Arial, sans-serif`;
      const metrics = ctx.measureText(el.value || '');
      // Use actualBoundingBox if available for more accurate text box
      const height = metrics.actualBoundingBoxAscent && metrics.actualBoundingBoxDescent
        ? metrics.actualBoundingBoxAscent + metrics.actualBoundingBoxDescent
        : size * 1.2; // Fallback: font size * 1.2 for typical line height
      return { w: metrics.width, h: height };
    } else if (el.type === 'qrcode') {
      return { w: size * MM_TO_PX, h: size * MM_TO_PX }; // size is in mm, convert to px
    } else if (el.type === 'barcode') {
      return { w: size * 2, h: size * 0.6 + 10 };
    } else if (el.type === 'image') {
      const h = el.height || size;
      return { w: size * MM_TO_PX, h: h * MM_TO_PX };
    }
    return { w: size, h: size };
  }, [template.textSizePt]);

  const drawOverlay = useCallback(() => {
    if (!editable) return;
    const overlay = overlayCanvasRef.current;
    const base = canvasRef.current;
    if (!overlay || !base) return;
    overlay.width = base.width; overlay.height = base.height;
    const ctx = overlay.getContext('2d'); if (!ctx) return;
    ctx.clearRect(0,0,overlay.width, overlay.height);
    ctx.save();
    elements.forEach((el, i) => {
      const x = el.x * MM_TO_PX + marginPx;
      const y = el.y * MM_TO_PX + marginPx;
      const m = measureElement(ctx, el);
      ctx.strokeStyle = dragIndex === i ? '#2563eb' : 'rgba(0,0,0,0.3)';
      ctx.setLineDash(dragIndex === i ? [4,2] : [3,3]);
      ctx.lineWidth = 1;
      ctx.strokeRect(x, y, m.w, m.h);
      // small handle
      ctx.fillStyle = dragIndex === i ? '#2563eb' : '#6b7280';
      ctx.fillRect(x-3, y-3, 6, 6);
    });
    ctx.restore();
  }, [editable, elements, dragIndex, marginPx, measureElement]);

  // Hit detection for dragging
  const findElementAt = useCallback((xCanvas: number, yCanvas: number): number | null => {
    const overlay = overlayCanvasRef.current; if (!overlay) return null;
    const ctx = overlay.getContext('2d'); if (!ctx) return null;
    for (let i = elements.length - 1; i >= 0; i--) { // search topmost last drawn
      const el = elements[i];
      const x = el.x * MM_TO_PX + marginPx;
      const y = el.y * MM_TO_PX + marginPx;
      const m = measureElement(ctx, el);
      if (xCanvas >= x && xCanvas <= x + m.w && yCanvas >= y && yCanvas <= y + m.h) {
        return i;
      }
    }
    return null;
  }, [elements, marginPx, measureElement]);

  // Mouse events only when editable
  useEffect(() => {
    if (!editable) return; 
  const overlay = overlayCanvasRef.current; const base = canvasRef.current; if (!base) return;

    const handlePointerDown = (e: PointerEvent) => {
  const rect = base.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale; 
      const y = (e.clientY - rect.top) / scale;
      const idx = findElementAt(x, y);
      if (idx !== null) {
        setDragIndex(idx);
        const el = elements[idx];
        const ex = el.x * MM_TO_PX + marginPx; const ey = el.y * MM_TO_PX + marginPx;
        dragOffset.current = { dx: x - ex, dy: y - ey };
      } else {
        setDragIndex(null);
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (dragIndex === null) return;
  const rect = base.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale; 
      const y = (e.clientY - rect.top) / scale;
      const newElements = [...elements];
      const el = { ...newElements[dragIndex] };
      // Convert px back to mm (subtract margin first)
  el.x = parseFloat(((x - dragOffset.current.dx - marginPx) / MM_TO_PX).toFixed(2));
  el.y = parseFloat(((y - dragOffset.current.dy - marginPx) / MM_TO_PX).toFixed(2));
      // Keep within bounds
      el.x = Math.max(0, Math.min(el.x, template.tagWidthMm));
      el.y = Math.max(0, Math.min(el.y, template.tagHeightMm));
      newElements[dragIndex] = el;
      onElementsChange?.(newElements);
    };
    const handlePointerUp = () => {
      if (dragIndex !== null) {
        setDragIndex(null);
      }
    };

    overlay?.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      overlay?.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [editable, elements, dragIndex, marginPx, onElementsChange, template.tagWidthMm, template.tagHeightMm, findElementAt, scale]);

  // Redraw overlay when interaction state changes
  useEffect(() => { drawOverlay(); }, [drawOverlay]);

  return (
    <>
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Template Preview {editable && <span className="text-xs text-gray-500">(drag elements)</span>}</h4>
        <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(true)}>
          <Maximize2 className="w-4 h-4 mr-2" />
          Vergrößern
        </Button>
      </div>
      <div className="border rounded-lg p-4 overflow-auto">
        <div className="relative inline-block" style={{ lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ 
              border: '1px solid #d1d5db', 
              background: '#ffffff', 
              display: 'block',
              width: `${displayWidth}px`,
              height: `${displayHeight}px`,
            }}
          />
          {editable && (
            <canvas
              ref={overlayCanvasRef}
              style={{ 
                position: 'absolute', 
                inset: 0, 
                cursor: dragIndex !== null ? 'grabbing' : 'grab', 
                background: 'transparent',
                width: `${displayWidth}px`,
                height: `${displayHeight}px`,
              }}
            />
          )}
        </div>
      </div>
      <div className="text-sm text-gray-600">
        <p><strong>Sample placeholders used:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li><code>{'{{printed_code}}'}</code> → {previewData.printed_code}</li>
          <li><code>{'{{equipment_name}}'}</code> → {previewData.equipment_name}</li>
          <li><code>{'{{article_name}}'}</code> → {previewData.article_name}</li>
          <li><code>{'{{location_name}}'}</code> → {previewData.location_name}</li>
        </ul>
      </div>
    </div>

    {/* Full-size modal */}
    <Dialog open={modalOpen} onOpenChange={setModalOpen}>
      <DialogContent className="!max-w-[90vw] w-full max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Template Preview (Vergrößert)</DialogTitle>
          <DialogDescription>
            Actual size: {template.tagWidthMm}mm × {template.tagHeightMm}mm (3x scaled for viewing)
          </DialogDescription>
        </DialogHeader>
        <div className="border rounded-lg p-4 overflow-auto bg-gray-50 flex items-center justify-center">
          <div className="relative inline-block" style={{ lineHeight: 0 }}>
            <canvas
              style={{ 
                border: '1px solid #d1d5db', 
                background: '#ffffff', 
                display: 'block',
                width: `${widthPx * 3}px`,
                height: `${heightPx * 3}px`,
              }}
              ref={(canvas) => {
                if (!canvas || !svgContent) return;
                canvas.width = widthPx;
                canvas.height = heightPx;
                const ctx = canvas.getContext('2d');
                if (!ctx) return;
                const blob = new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                const img = new Image();
                img.onload = () => {
                  ctx.clearRect(0, 0, widthPx, heightPx);
                  ctx.drawImage(img, 0, 0);
                  URL.revokeObjectURL(url);
                };
                img.src = url;
              }}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}