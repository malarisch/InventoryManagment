
import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const supabase = await createClient();
  const { id } = await context.params;
  const format = req.nextUrl.searchParams.get('format') || 'svg';

  const { data: assetTag, error } = await supabase
    .from('asset_tags')
    .select('*, asset_tag_templates(*)')
    .eq('id', id)
    .single();

  if (error || !assetTag) {
    return new NextResponse('Asset tag not found', { status: 404 });
  }

  // Ensure template exists on the referenced asset_tag_template
  if (!assetTag.asset_tag_templates?.template) {
    return new NextResponse('Asset tag template not found', { status: 404 });
  }

  const { data: svgData, error: svgError } = await supabase.storage
    .from('public-assets')
    .download(`asset-tag-prototypes/${assetTag.printed_template}.svg`);

  if (svgError || !svgData) {
    return new NextResponse('SVG prototype not found', { status: 404 });
  }

  let svgText = await svgData.text();

  // Replace placeholders
  svgText = svgText.replace('{{printed_code}}', assetTag.printed_code || '');

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
