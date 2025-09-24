import type { AssetTagTemplate } from '@/components/asset-tag-templates/types';

export interface PlaceholderData {
  [key: string]: string;
}

/**
 * Generates SVG from asset tag template definition
 */
export function generateSVG(template: AssetTagTemplate, placeholderData: PlaceholderData = {}): string {
  const { tagWidthMm, tagHeightMm, marginMm, backgroundColor, borderColor, borderWidthMm, textColor, isMonochrome } = template;
  
  // Convert mm to pixels (approximate 3.779527559 pixels per mm at 96 DPI)
  const mmToPx = 3.779527559;
  const width = tagWidthMm * mmToPx;
  const height = tagHeightMm * mmToPx;
  const margin = (marginMm || 0) * mmToPx;
  const borderWidth = (borderWidthMm || 0) * mmToPx;

  // Apply monochrome override
  const bgColor = isMonochrome ? '#ffffff' : backgroundColor;
  const borderCol = isMonochrome ? '#000000' : borderColor;
  const textCol = isMonochrome ? '#000000' : textColor;

  let svg = `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">`;
  
  // Background
  svg += `<rect x="0" y="0" width="${width}" height="${height}" fill="${bgColor}"/>`;
  
  // Border
  if (borderWidth > 0) {
    svg += `<rect x="${borderWidth/2}" y="${borderWidth/2}" width="${width - borderWidth}" height="${height - borderWidth}" 
            fill="none" stroke="${borderCol}" stroke-width="${borderWidth}"/>`;
  }

  // Elements
  template.elements?.forEach(element => {
    const x = (element.x || 0) * mmToPx + margin;
    const y = (element.y || 0) * mmToPx + margin;
    const size = element.size || template.textSizePt || 12;
    const color = element.color || textCol;

    // Replace placeholders in value
    let value = element.value || '';
    Object.entries(placeholderData).forEach(([key, replacement]) => {
      value = value.replace(new RegExp(`\\{${key}\\}`, 'g'), replacement);
    });

    switch (element.type) {
      case 'text':
        svg += `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" font-family="Arial, sans-serif">${escapeXml(value)}</text>`;
        break;
      
      case 'qrcode':
        // For now, just show placeholder text - full QR code generation would need a library
        svg += `<rect x="${x}" y="${y}" width="${size}" height="${size}" fill="none" stroke="${color}" stroke-width="1"/>`;
        svg += `<text x="${x + size/2}" y="${y + size/2 + 3}" font-size="8" fill="${color}" text-anchor="middle">QR</text>`;
        break;
      
      case 'barcode':
        // For now, just show placeholder - full barcode generation would need a library
        const barcodeWidth = size * 2;
        const barcodeHeight = size * 0.6;
        svg += `<rect x="${x}" y="${y}" width="${barcodeWidth}" height="${barcodeHeight}" fill="none" stroke="${color}" stroke-width="1"/>`;
        svg += `<text x="${x + barcodeWidth/2}" y="${y + barcodeHeight + 10}" font-size="8" fill="${color}" text-anchor="middle">${escapeXml(value)}</text>`;
        break;
    }
  });

  svg += '</svg>';
  
  return svg;
}

/**
 * Escapes XML special characters
 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates placeholder data for asset tags from database record
 */
export function getAssetTagPlaceholders(
  assetTag: { printed_code?: string | null }, 
  equipment?: { name?: string } | null, 
  article?: { name?: string } | null, 
  location?: { name?: string } | null
): PlaceholderData {
  return {
    printed_code: assetTag.printed_code || '',
    equipment_name: equipment?.name || '',
    article_name: article?.name || '',
    location_name: location?.name || '',
    current_date: new Date().toLocaleDateString(),
    // Add more placeholders as needed
  };
}