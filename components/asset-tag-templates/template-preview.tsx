'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { generateSVG } from '@/lib/asset-tags/svg-generator';
import type { AssetTagTemplate } from '@/components/asset-tag-templates/types';

interface AssetTagTemplatePreviewProps {
  template: AssetTagTemplate;
}

export function AssetTagTemplatePreview({ template }: AssetTagTemplatePreviewProps) {
  const [showPreview, setShowPreview] = useState(false);

  const previewData = {
    printed_code: 'EQ001',
    equipment_name: 'Camera Sony FX6',
    article_name: 'Professional Camera',
    location_name: 'Studio A',
    current_date: new Date().toLocaleDateString(),
  };

  const svgContent = generateSVG(template, previewData);

  if (!showPreview) {
    return (
      <Button type="button" variant="outline" onClick={() => setShowPreview(true)}>
        Show Preview
      </Button>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h4 className="font-medium">Template Preview</h4>
        <Button type="button" variant="outline" size="sm" onClick={() => setShowPreview(false)}>
          Hide Preview
        </Button>
      </div>
      
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex justify-center">
          <div 
            className="border border-gray-300 bg-white"
            dangerouslySetInnerHTML={{ __html: svgContent }}
          />
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