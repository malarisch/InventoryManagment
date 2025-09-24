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

    // Fetch asset tag + template + referencing entities (equipment, article, location)
    // Reverse FKs: equipments.asset_tag, articles.asset_tag, locations.asset_tag
    const { data: assetTag, error: tagError } = await supabase
      .from('asset_tags')
      .select(`
        id,
        printed_code,
        printed_template,
        asset_tag_templates:asset_tag_templates!printed_template(template),
        equipments:equipments_asset_tag_fkey(id, metadata, articles(id, name), locations(name)),
        articles:articles_asset_tag_fkey(id, name),
        locations:locations_asset_tag_fkey(id, name),
        cases:cases_asset_tag_fkey(id, case_equipment)
      `)
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

    interface AssetTagJoined {
      id: number;
      printed_code: string;
      printed_template?: number;
      asset_tag_templates?: { template?: AssetTagTemplate };
      equipments?: Array<{
        id: number;
        metadata: unknown;
        articles?: { id?: number; name?: string } | null;
        locations?: { name?: string } | null;
      }>;
      articles?: Array<{ id: number; name?: string }>;
      locations?: Array<{ id: number; name?: string }>;
      cases?: Array<{ id: number; case_equipment?: number | null }>;
    }

    const joined = assetTag as AssetTagJoined;
    const equipmentRow = joined.equipments?.[0];
    let articleRow = joined.articles?.[0] || null;
    const locationRow = joined.locations?.[0] || null;
    // If no direct article but equipment has an article reference, synthesize articleRow
    if (!articleRow && equipmentRow?.articles) {
      // Synthesize minimal article object from equipment's related article
      articleRow = { id: equipmentRow.articles.id ?? 0, name: equipmentRow.articles.name };
    }

    // Derive friendly equipment name similar to previous logic
    let equipment: { name: string } | null = null;
    if (equipmentRow) {
      const metaName = (equipmentRow.metadata as { name?: string } | null)?.name;
      equipment = { name: metaName || `${equipmentRow.articles?.name || 'Equipment'} #${equipmentRow.id}` };
    }
  const article = articleRow ? { name: articleRow.name } : null;
  // cases currently unused in placeholder generation, but could be extended
    const location = locationRow ? { name: locationRow.name } : null;

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
