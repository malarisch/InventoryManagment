import { NextResponse } from 'next/server';
import { generateSVG } from '@/lib/asset-tags/svg-generator';

// Server-side preview renderer that embeds external images as base64 data URIs
// This avoids CORS issues that occur when the client tries to fetch cross-origin images directly.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { template, placeholderData } = body || {};
    if (!template) {
      return NextResponse.json({ error: 'Missing template' }, { status: 400 });
    }
    const svg = await generateSVG(template, placeholderData || {}, { embedImages: true });
    return NextResponse.json({ svg });
  } catch (e: unknown) {
    console.error('Preview generation failed', e);
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 });
  }
}
