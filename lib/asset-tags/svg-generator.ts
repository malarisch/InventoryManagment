import QRCode from 'qrcode';

import type { AssetTagTemplate } from '@/components/asset-tag-templates/types';

export interface PlaceholderData {
  [key: string]: string;
}

/**
 * Generates SVG from asset tag template definition
 */
export async function generateSVG(
  template: AssetTagTemplate,
  placeholderData: PlaceholderData = {},
  opts: { embedImages?: boolean } = {}
): Promise<string> {
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
  if (template.elements) {
  for (const element of template.elements) {
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
        case 'text': {
          svg += `<text x="${x}" y="${y}" font-size="${size}" fill="${color}" color="${color}" font-family="Arial, sans-serif">${escapeXml(value)}</text>`;
          break;
        }
        case 'qrcode': {
          try {
            const qr = await QRCode.toDataURL(value || '');
            svg += `<image href="${qr}" x="${x}" y="${y}" width="${size}" height="${size}" />`;
          } catch {
            svg += `<rect x="${x}" y="${y}" width="${size*mmToPx}" height="${size*mmToPx}" fill="none" stroke="${color}" stroke-width="1"/>`;
            svg += `<text x="${x + size/2}" y="${y + size/2}" font-size="8" fill="${color}" text-anchor="middle">QR</text>`;
          }
          break;
        }
        case 'image': {
          const h = (element.height || size);
          let href = value;
          if (opts.embedImages && value) {
            try {
              // Only attempt for http(s) or / paths
              if (/^(https?:\/\/|\/)/i.test(value)) {
                // NOTE: Relative paths ('/') cannot be fetched server-side without absolute origin; skip embedding for those.
                if (value.startsWith('/')) {
                  // leave as-is (client will load it since same-origin); no embedding
                } else {
                  const res = await fetch(value);
                  if (res.ok) {
                    if (typeof window === 'undefined') {
                      // Server environment: use arrayBuffer + Buffer
                      const ab = await res.arrayBuffer();
                      const mime = res.headers.get('content-type') || 'image/png';
                      const b64 = Buffer.from(ab).toString('base64');
                      href = `data:${mime};base64,${b64}`;
                    } else {
                      const blob = await res.blob();
                      const dataUrl = await blobToDataUrl(blob);
                      href = dataUrl;
                    }
                  }
                }
              }
            } catch (e) {
              console.warn('Image embed failed, falling back to direct href', e);
            }
          }
          svg += `<image href="${escapeXml(href)}" x="${x}" y="${y}" width="${size}" height="${h}" preserveAspectRatio="xMidYMid meet" />`;
          break;
        }
        case 'barcode': {
          // Placeholder barcode representation (stub)
            const barcodeWidth = size * 2;
            const barcodeHeight = size * 0.6;
            svg += `<rect x="${x}" y="${y}" width="${barcodeWidth}" height="${barcodeHeight}" fill="none" stroke="${color}" stroke-width="1"/>`;
            svg += `<text x="${x + barcodeWidth/2}" y="${y + barcodeHeight + 10}" font-size="8" fill="${color}" text-anchor="middle">${escapeXml(value)}</text>`;
            break;
        }
      }
    }
  }

  svg += '</svg>';
  
  return svg;
}

  async function blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') resolve(reader.result);
        else reject(new Error('Failed to convert blob to data URL'));
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
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
  equipment?: { name?: string, id?: number } | null, 
  
  article?: { name?: string } | null, 
  location?: { name?: string } | null,
  caseeq?: { name?: string } | null
  
): PlaceholderData {
  console.log('Generating placeholders with:', { assetTag, equipment, article, location });
  let safeName = 'Unknown';
  if (equipment?.name) {
    safeName = equipment.name;
  } else if (equipment?.id && article?.name) {
    safeName = `${article.name} #${equipment.id}`;
  } else if (article?.name) {
    safeName = article.name;
  } else if (location?.name) {
    safeName = location.name;
  } else if (caseeq?.name) {
    safeName = caseeq.name;
  }
  return {
    printed_code: assetTag.printed_code || '',
    equipment_name: equipment?.name || '',
    article_name: article?.name || '',
    location_name: location?.name || '',
    case_name: caseeq?.name || '',
    current_date: new Date().toLocaleDateString(),
    safe_name: safeName

    // Add more placeholders as needed
  };
}