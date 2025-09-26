import {createClient} from '@/lib/supabase/server';
import {NextRequest, NextResponse} from 'next/server';
import sharp from 'sharp';
import {generateSVG, getAssetTagPlaceholders} from '@/lib/asset-tags/svg-generator';
import type {AssetTagTemplate} from '@/components/asset-tag-templates/types';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> })  {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const format = req.nextUrl.searchParams.get('format') || 'svg';

    // Fetch asset tag + template (FK)
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

    // Load referencing entities via reverse FK lookups (optional)
    const [
      { data: equipmentData, error: equipError },
      { data: articleData, error: articleError },
      { data: locationData, error: locationError },
      { data: caseData, error: caseError }
    ] = await Promise.all([
      supabase.from('equipments').select('id, metadata, articles(id, name), locations(name)').eq('asset_tag', id).maybeSingle(),
      supabase.from('articles').select('id, name').eq('asset_tag', id).maybeSingle(),
      supabase.from('locations').select('id, name').eq('asset_tag', id).maybeSingle(),
      supabase.from('cases').select('id, name').eq('asset_tag', id).maybeSingle(),
    ]);

    if (equipError) console.warn('equipment lookup failed (continuing):', equipError.message);
    if (articleError) console.warn('article lookup failed (continuing):', articleError.message);
    if (locationError) console.warn('location lookup failed (continuing):', locationError.message);
    if (caseError) console.warn('case lookup failed (continuing):', caseError.message);

    // Build friendly entities
    let equipment: { name: string; id?: number } | null = null;
    let article: { name?: string } | null = null;
    let location: { name?: string } | null = null;
    let caseeq: { name?: string } | null = null;

    if (equipmentData) {
      const metaName = (equipmentData.metadata as { name?: string } | null)?.name;
      const eqArticle = (equipmentData as unknown as { articles?: { id?: number; name?: string } | { id?: number; name?: string }[] }).articles;
      const singleArticle = Array.isArray(eqArticle) ? eqArticle[0] : eqArticle;
      equipment = { name: metaName || `${singleArticle?.name || 'Equipment'} #${equipmentData.id}`, id: equipmentData.id };
      if (singleArticle) article = { name: singleArticle.name };
      const eqLocation = (equipmentData as unknown as { locations?: { name?: string } | { name?: string }[] }).locations;
      const singleLocation = Array.isArray(eqLocation) ? eqLocation[0] : eqLocation;
      if (singleLocation) location = { name: singleLocation.name };
    }

    if (!article && articleData) article = { name: articleData.name };
    if (!location && locationData) location = { name: locationData.name };
    if (caseData) caseeq = { name: caseData.name };

    const placeholderData = getAssetTagPlaceholders(
      assetTag as { printed_code?: string | null },
      equipment,
      article,
      location,
      caseeq
    );
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
