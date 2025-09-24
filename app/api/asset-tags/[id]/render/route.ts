
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateSVG, getAssetTagPlaceholders } from '@/lib/asset-tags/svg-generator';
import type { AssetTagTemplate } from '@/components/asset-tag-templates/types';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await context.params;
  const format = req.nextUrl.searchParams.get('format') || 'svg';

  // Get asset tag with template and related data for placeholders
  const { data: assetTag, error } = await supabase
    .from('asset_tags')
    .select(`
      *,
      asset_tag_templates(*)
    `)
    .eq('id', id)
    .single();

  if (error || !assetTag) {
    return new NextResponse('Asset tag not found', { status: 404 });
  }

  // Ensure template exists with template data
  if (!assetTag.asset_tag_templates?.template) {
    return new NextResponse('Asset tag template not found', { status: 404 });
  }

  // Get related equipment/article/location for placeholders
  let equipment: { name?: string } | null = null;
  let article: { name?: string } | null = null;
  let location: { name?: string } | null = null;

  // If this asset tag is linked to equipment, fetch that data
  const { data: equipmentData } = await supabase
    .from('equipments')
    .select(`
      id,
      metadata,
      articles!inner(name),
      locations(name)
    `)
    .eq('asset_tag', id)
    .single();

  if (equipmentData) {
    equipment = { name: (equipmentData.metadata as { name?: string } | null)?.name || `Equipment ${equipmentData.id}` };
    
    // Handle articles array or object
    const articlesData = equipmentData.articles;
    if (Array.isArray(articlesData) && articlesData.length > 0) {
      article = articlesData[0];
    } else if (articlesData && !Array.isArray(articlesData)) {
      article = articlesData as { name?: string };
    }
    
    // Handle locations array or object  
    const locationsData = equipmentData.locations;
    if (Array.isArray(locationsData) && locationsData.length > 0) {
      location = locationsData[0] as { name?: string };
    } else if (locationsData && !Array.isArray(locationsData)) {
      location = locationsData as { name?: string };
    }
  }

  const template = assetTag.asset_tag_templates.template as AssetTagTemplate;
  const placeholderData = getAssetTagPlaceholders(assetTag, equipment, article, location);
  
  const svgText = generateSVG(template, placeholderData);

  if (format === 'svg') {
    return new NextResponse(svgText, {
      headers: {
        'Content-Type': 'image/svg+xml',
      },
    });
  }

  const svgBuffer = Buffer.from(svgText);

  let imageBuffer: Buffer;
  let contentType: string;

  switch (format) {
    case 'png':
      imageBuffer = await sharp(svgBuffer).png().toBuffer();
      contentType = 'image/png';
      break;
    case 'bmp':
      imageBuffer = await (sharp(svgBuffer) as unknown as { bmp: () => sharp.Sharp }).bmp().toBuffer();
      contentType = 'image/bmp';
      break;
    case 'gif':
      imageBuffer = await sharp(svgBuffer).gif().toBuffer();
      contentType = 'image/gif';
      break;
    default:
      return new NextResponse('Invalid format', { status: 400 });
  }

  return new NextResponse(new Uint8Array(imageBuffer) as unknown as BodyInit, {
    headers: {
      'Content-Type': contentType,
    },
  });
}
