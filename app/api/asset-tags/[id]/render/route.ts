import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { generateSVG, getAssetTagPlaceholders } from '@/lib/asset-tags/svg-generator';
import type { AssetTagTemplate } from '@/components/asset-tag-templates/types';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const format = req.nextUrl.searchParams.get('format') || 'svg';

    // Fetch asset tag + template via FK
    const { data: assetTag, error: tagError } = await supabase
      .from('asset_tags')
      .select('id, printed_code, printed_template, asset_tag_templates:asset_tag_templates!printed_template(template)')
      .eq('id', id)
      .maybeSingle();

    if (tagError) {
      console.error('asset_tag query error', tagError);
      return new NextResponse('Asset tag not found', { status: 404 });
    }
    if (!assetTag) {
      return new NextResponse('Asset tag not found', { status: 404 });
    }

    const templateJson = (assetTag as { asset_tag_templates?: { template?: AssetTagTemplate } }).asset_tag_templates?.template as AssetTagTemplate | undefined;
    if (!templateJson) {
      return new NextResponse('Asset tag template not found', { status: 404 });
    }

    // Optional related entities (do not force inner joins)
    const { data: equipmentData, error: equipError } = await supabase
      .from('equipments')
      .select('id, metadata, articles(name), locations(name)')
      .eq('asset_tag', id)
      .maybeSingle();
    if (equipError) {
      console.warn('equipment lookup failed (continuing):', equipError.message);
    }

    let equipment: { name?: string } | null = null;
    let article: { name?: string } | null = null;
    let location: { name?: string } | null = null;

    if (equipmentData) {
      equipment = { name: (equipmentData.metadata as { name?: string } | null)?.name || `Equipment ${equipmentData.id}` };
      const artRaw = (equipmentData as unknown as { articles?: { name?: string } | { name?: string }[] }).articles;
      if (artRaw) article = Array.isArray(artRaw) ? artRaw[0] : artRaw;
      const locRaw = (equipmentData as unknown as { locations?: { name?: string } | { name?: string }[] }).locations;
      if (locRaw) location = Array.isArray(locRaw) ? locRaw[0] : locRaw;
    }

    const placeholderData = getAssetTagPlaceholders(assetTag, equipment, article, location);
  const svgText = await generateSVG(templateJson, placeholderData);

    if (format === 'svg') {
      return new NextResponse(svgText, { headers: { 'Content-Type': 'image/svg+xml' } });
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

    return new NextResponse(new Uint8Array(imageBuffer), { headers: { 'Content-Type': contentType } });
  } catch (err) {
    console.error('render asset tag fatal error', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
