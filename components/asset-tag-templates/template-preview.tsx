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
  /** Preview data for template placeholders */
  previewData?: Record<string, string>;
}

// px per mm (approx 96 dpi)
const MM_TO_PX = 3.779527559;

// Default mock data - exported for use in form
export const DEFAULT_PREVIEW_DATA = {
  printed_code: 'EQ-2024-0815',
  equipment_name: 'Sony FX6 Cinema Camera',
  article_name: 'Professional Cinema Camera',
  location_name: 'Studio A - Rack 3',
  case_name: 'Camera Case 1',
  company_name: 'EventTech Solutions GmbH',
  current_date: new Date().toLocaleDateString('de-DE'),
  qr_url: 'https://app.example.com/equipment/EQ-2024-0815',
};

export function AssetTagTemplatePreview({ template, editable = false, onElementsChange, maxWidth = 400, previewData = DEFAULT_PREVIEW_DATA }: AssetTagTemplatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null); // for selection boxes
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOffset = useRef<{dx: number; dy: number; anchorShift: number; baselineShift: number}>({ dx: 0, dy: 0, anchorShift: 0, baselineShift: 0 });
  const [modalOpen, setModalOpen] = useState(false);
  const lastPointerDownTime = useRef<number>(0);

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
  
  // Use refs to avoid re-registering event listeners on every element change
  const elementsRef = useRef(elements);
  const onElementsChangeRef = useRef(onElementsChange);
  // Throttle emit to avoid excessive re-renders while dragging
  const lastEmitRef = useRef(0);
  const trailingTimeoutRef = useRef<number | null>(null);
  const nextElementsRef = useRef<AssetTagTemplateElement[] | null>(null);
  const lastComputedRef = useRef<AssetTagTemplateElement[] | null>(null);
  const didDragRef = useRef(false);
  
  useEffect(() => {
    elementsRef.current = elements;
  }, [elements]);
  
  useEffect(() => {
    onElementsChangeRef.current = onElementsChange;
  }, [onElementsChange]);

  // Async generated SVG string - now client-side only for instant updates during drag
  const [svgContent, setSvgContent] = useState<string>('');
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const nextTemplate = { ...template, elements: template.elements ? [...template.elements] : [] };
        const svg = await generateSVG(nextTemplate, previewData);
        if (!cancelled) setSvgContent(svg);
      } catch (e) {
        console.error('Client-side preview generation failed', e);
        if (!cancelled) setSvgContent('');
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
    };
    img.src = url;
  }, [svgContent, widthPx, heightPx]);

  // Bounding box calculation helper (minimal logic duplication just for interaction layer)
  const calculateElementMetrics = useCallback((ctx: CanvasRenderingContext2D, el: AssetTagTemplateElement) => {
    const size = el.size || template.textSizePt || 12;
    if (el.type === 'text') {
      ctx.font = `${size}px Arial, sans-serif`;
      const metrics = ctx.measureText(el.value || '');
      const ascent = metrics.actualBoundingBoxAscent ?? size * 0.8;
      const descent = metrics.actualBoundingBoxDescent ?? size * 0.2;
      return { width: metrics.width, height: ascent + descent, ascent };
    }
    if (el.type === 'qrcode') {
      const side = size * MM_TO_PX;
      return { width: side, height: side, ascent: 0 };
    }
    if (el.type === 'barcode') {
      const width = size * 2;
      const height = size * 0.6 + 10;
      return { width, height, ascent: 0 };
    }
    if (el.type === 'image') {
      const h = el.height || size;
      return { width: size * MM_TO_PX, height: h * MM_TO_PX, ascent: 0 };
    }
    return { width: size, height: size, ascent: 0 };
  }, [template.textSizePt]);

  const getBoundingBox = useCallback((ctx: CanvasRenderingContext2D, el: AssetTagTemplateElement) => {
    const metrics = calculateElementMetrics(ctx, el);
    const anchorX = (el.x || 0) * MM_TO_PX + marginPx;
    const anchorY = (el.y || 0) * MM_TO_PX + marginPx;
    let left = anchorX;
    let top = anchorY;
    let anchorShift = 0;
    let baselineShift = 0;

    if (el.type === 'text') {
      const align = el.textAlign || 'left';
      if (align === 'center') {
        left = anchorX - metrics.width / 2;
        anchorShift = metrics.width / 2;
      } else if (align === 'right') {
        left = anchorX - metrics.width;
        anchorShift = metrics.width;
      }
      top = anchorY - metrics.ascent;
      baselineShift = metrics.ascent;
    }

    return {
      left,
      top,
      width: metrics.width,
      height: metrics.height,
      anchorShift,
      baselineShift,
      anchorX,
      anchorY,
    };
  }, [calculateElementMetrics, marginPx]);

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
      const bounds = getBoundingBox(ctx, el);
      const width = bounds.width || 2;
      const height = bounds.height || (template.textSizePt || 12);
      const rectX = bounds.width ? bounds.left : bounds.left - width / 2;
      const rectY = bounds.top;
      ctx.strokeStyle = dragIndex === i ? '#2563eb' : 'rgba(0,0,0,0.3)';
      ctx.setLineDash(dragIndex === i ? [4,2] : [3,3]);
      ctx.lineWidth = 1;
      ctx.strokeRect(rectX, rectY, width, height);
      // small handle
      ctx.fillStyle = dragIndex === i ? '#2563eb' : '#6b7280';
  const anchorX = bounds.anchorX;
  const anchorY = bounds.top + bounds.baselineShift;
      const handleSize = 6;
      ctx.fillRect(anchorX - handleSize / 2, anchorY - handleSize / 2, handleSize, handleSize);
    });
    ctx.restore();
  }, [editable, elements, dragIndex, getBoundingBox, template.textSizePt]);

  // Separate effect for overlay to avoid circular dependencies
  useEffect(() => {
    drawOverlay();
  }, [drawOverlay]);

  // Hit detection for dragging
  const findElementAt = useCallback((xCanvas: number, yCanvas: number): number | null => {
    const overlay = overlayCanvasRef.current; if (!overlay) return null;
    const ctx = overlay.getContext('2d'); if (!ctx) return null;
    for (let i = elements.length - 1; i >= 0; i--) { // search topmost last drawn
      const el = elements[i];
      const bounds = getBoundingBox(ctx, el);
      const width = bounds.width || 2;
      const height = bounds.height || (template.textSizePt || 12);
      const rectX = bounds.width ? bounds.left : bounds.left - width / 2;
      const rectY = bounds.top;
      if (xCanvas >= rectX && xCanvas <= rectX + width && yCanvas >= rectY && yCanvas <= rectY + height) {
        return i;
      }
    }
    return null;
  }, [elements, getBoundingBox]);

  // Mouse events only when editable
  useEffect(() => {
    if (!editable) return; 
  const overlay = overlayCanvasRef.current; const base = canvasRef.current; if (!base) return;

    const handlePointerDown = (e: PointerEvent) => {
      lastPointerDownTime.current = performance.now();
      didDragRef.current = false;
  const rect = base.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale; 
      const y = (e.clientY - rect.top) / scale;
      const idx = findElementAt(x, y);
      if (idx !== null) {
        setDragIndex(idx);
        const el = elementsRef.current[idx];
        const ctx = overlay?.getContext('2d');
        if (!ctx) return;
        const bounds = getBoundingBox(ctx, el);
        dragOffset.current = {
          dx: x - bounds.left,
          dy: y - bounds.top,
          anchorShift: bounds.anchorShift,
          baselineShift: bounds.baselineShift,
        };
      } else {
        setDragIndex(null);
      }
    };
    const handlePointerMove = (e: PointerEvent) => {
      if (dragIndex === null) return;
      const elapsed = performance.now() - lastPointerDownTime.current;
      if (elapsed < 120) {
        return;
      }
  const rect = base.getBoundingClientRect();
      const x = (e.clientX - rect.left) / scale; 
      const y = (e.clientY - rect.top) / scale;
  const newElements = [...elementsRef.current];
      const el = { ...newElements[dragIndex] };
  didDragRef.current = true;
    const leftPx = x - dragOffset.current.dx;
    const topPx = y - dragOffset.current.dy;
    const anchorPx = leftPx + dragOffset.current.anchorShift;
    const baselinePx = topPx + dragOffset.current.baselineShift;
    el.x = parseFloat(((anchorPx - marginPx) / MM_TO_PX).toFixed(2));
    el.y = parseFloat(((baselinePx - marginPx) / MM_TO_PX).toFixed(2));
      // Keep within bounds
      el.x = Math.max(0, Math.min(el.x, template.tagWidthMm));
      el.y = Math.max(0, Math.min(el.y, template.tagHeightMm));
      newElements[dragIndex] = el;
      lastComputedRef.current = newElements;
      // Throttle to ~10 Hz
      const now = performance.now();
      const minInterval = 100; // ms
      const timeSince = now - lastEmitRef.current;
      if (timeSince >= minInterval) {
        lastEmitRef.current = now;
        onElementsChangeRef.current?.(newElements);
      } else {
        nextElementsRef.current = newElements;
        if (trailingTimeoutRef.current != null) {
          window.clearTimeout(trailingTimeoutRef.current);
        }
        const delay = Math.max(0, minInterval - timeSince);
        trailingTimeoutRef.current = window.setTimeout(() => {
          lastEmitRef.current = performance.now();
          const next = nextElementsRef.current ?? newElements;
          onElementsChangeRef.current?.(next);
          nextElementsRef.current = null;
          trailingTimeoutRef.current = null;
        }, delay);
      }
    };
    const handlePointerUp = () => {
      if (dragIndex !== null) {
        setDragIndex(null);
      }
      // Flush any pending update at drag end
      if (trailingTimeoutRef.current != null) {
        window.clearTimeout(trailingTimeoutRef.current);
        trailingTimeoutRef.current = null;
      }
      if (didDragRef.current && lastComputedRef.current) {
        lastEmitRef.current = performance.now();
        onElementsChangeRef.current?.(lastComputedRef.current);
        nextElementsRef.current = null;
      }
      didDragRef.current = false;
      lastComputedRef.current = null;
    };

    overlay?.addEventListener('pointerdown', handlePointerDown);
    overlay?.addEventListener('pointerleave', handlePointerUp);
    overlay?.addEventListener('pointercancel', handlePointerUp);

    const cancelDragOnWindowPointerMove = (event: PointerEvent) => {
      if (document.activeElement && overlay?.contains(document.activeElement)) return;
      handlePointerMove(event);
    };

    const cancelDragOnWindowPointerUp = (event: PointerEvent) => {
      handlePointerUp();
      if (!(event.target instanceof Node)) return;
      if (overlay?.contains(event.target)) return;
      if (dragIndex !== null) {
        setDragIndex(null);
      }
    };

    window.addEventListener('pointermove', cancelDragOnWindowPointerMove);
    window.addEventListener('pointerup', cancelDragOnWindowPointerUp);
    return () => {
  overlay?.removeEventListener('pointerdown', handlePointerDown);
  overlay?.removeEventListener('pointerleave', handlePointerUp);
  overlay?.removeEventListener('pointercancel', handlePointerUp);
  window.removeEventListener('pointermove', cancelDragOnWindowPointerMove);
  window.removeEventListener('pointerup', cancelDragOnWindowPointerUp);
      if (trailingTimeoutRef.current != null) {
        window.clearTimeout(trailingTimeoutRef.current);
        trailingTimeoutRef.current = null;
      }
    };
  }, [editable, dragIndex, marginPx, template.tagWidthMm, template.tagHeightMm, findElementAt, scale, getBoundingBox]);

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