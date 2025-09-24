'use client';

import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import type { AssetTagTemplate, AssetTagTemplateElement } from '@/components/asset-tag-templates/types';
import { generateSVG } from '@/lib/asset-tags/svg-generator';

interface AssetTagTemplatePreviewProps {
  template: AssetTagTemplate;
  /** When true elements become draggable and onElementsChange will be called */
  editable?: boolean;
  /** Callback with updated elements after drag */
  onElementsChange?: (elements: AssetTagTemplateElement[]) => void;
}

// px per mm (approx 96 dpi)
const MM_TO_PX = 3.779527559;

export function AssetTagTemplatePreview({ template, editable = false, onElementsChange }: AssetTagTemplatePreviewProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null); // for selection boxes
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const dragOffset = useRef<{dx: number; dy: number}>({ dx: 0, dy: 0 });

  // Sample placeholder data for preview – keep consistent with previous implementation
  const previewData = useMemo(() => ({
    printed_code: 'EQ001',
    equipment_name: 'Camera Sony FX6',
    article_name: 'Professional Camera',
    location_name: 'Studio A',
    current_date: new Date().toLocaleDateString(),
  }), []);

  const widthPx = template.tagWidthMm * MM_TO_PX;
  const heightPx = template.tagHeightMm * MM_TO_PX;
  const marginPx = (template.marginMm || 0) * MM_TO_PX;

  const elements: AssetTagTemplateElement[] = useMemo(()=> template.elements || [], [template.elements]);

  // Generate the SVG string via existing generator (single source of truth)
  const svgContent = useMemo(() => generateSVG(template, previewData), [template, previewData]);

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
  }, [svgContent, widthPx, heightPx, editable]);

  // Bounding box calculation helper (minimal logic duplication just for interaction layer)
  const measureElement = useCallback((ctx: CanvasRenderingContext2D, el: AssetTagTemplateElement) => {
    const size = el.size || template.textSizePt || 12;
    if (el.type === 'text') {
      ctx.font = `${size}px Arial, sans-serif`;
      const metrics = ctx.measureText(el.value || '');
      return { w: metrics.width, h: size };
    } else if (el.type === 'qrcode') {
      return { w: size, h: size };
    } else if (el.type === 'barcode') {
      return { w: size * 2, h: size * 0.6 + 10 };
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
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
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
      const x = e.clientX - rect.left; const y = e.clientY - rect.top;
      const newElements = [...elements];
      const el = { ...newElements[dragIndex] };
      // Convert px back to mm (subtract margin first)
      el.x = (x - dragOffset.current.dx - marginPx) / MM_TO_PX;
      el.y = (y - dragOffset.current.dy - marginPx) / MM_TO_PX;
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
  }, [editable, elements, dragIndex, marginPx, onElementsChange, template.tagWidthMm, template.tagHeightMm, findElementAt]);

  // Redraw overlay when interaction state changes
  useEffect(() => { drawOverlay(); }, [drawOverlay]);

  return (
    <div className="space-y-4 select-none">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Template Preview {editable && <span className="text-xs text-gray-500">(drag elements)</span>}</h4>
      </div>
      <div className="border rounded-lg p-4">
        <div className="relative inline-block" style={{ lineHeight: 0 }}>
          <canvas
            ref={canvasRef}
            style={{ border: '1px solid #d1d5db', background: '#ffffff', display: 'block' }}
          />
          {editable && (
            <canvas
              ref={overlayCanvasRef}
              style={{ position: 'absolute', inset: 0, cursor: dragIndex !== null ? 'grabbing' : 'grab', background: 'transparent' }}
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
          <li><code>{'{{current_date}}'}</code> → {previewData.current_date}</li>
        </ul>
      </div>
    </div>
  );
}