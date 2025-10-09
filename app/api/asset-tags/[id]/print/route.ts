import {createClient} from '@/lib/supabase/server';
import {NextRequest, NextResponse} from 'next/server';
import {generateSVG, getAssetTagPlaceholders} from '@/lib/asset-tags/svg-generator';
import type {AssetTagTemplate} from '@/components/asset-tag-templates/types';

export async function GET(req: NextRequest, context: { params: Promise<{ id: string }> })  {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const widthParam = req.nextUrl.searchParams.get('width');
    const heightParam = req.nextUrl.searchParams.get('height');

    // Parse dimensions (mm from template)
    const widthMm = widthParam ? parseFloat(widthParam) : undefined;
    const heightMm = heightParam ? parseFloat(heightParam) : undefined;

    // Fetch asset tag + template (FK)
    const { data: assetTag, error: tagError } = await supabase
      .from('asset_tags')
      .select('id, printed_code, printed_template, company_id, asset_tag_templates:asset_tag_templates!printed_template(template)')
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
      { data: caseData, error: caseError },
      { data: companyData, error: companyError }
    ] = await Promise.all([
      supabase.from('equipments').select('id, metadata, articles(id, name), locations(name), company_id').eq('asset_tag', id).maybeSingle(),
      supabase.from('articles').select('id, name, company_id').eq('asset_tag', id).maybeSingle(),
      supabase.from('locations').select('id, name, company_id').eq('asset_tag', id).maybeSingle(),
      supabase.from('cases').select('id, name, company_id').eq('asset_tag', id).maybeSingle(),
      assetTag.company_id 
        ? supabase.from('companies').select('id, name').eq('id', assetTag.company_id).maybeSingle()
        : Promise.resolve({ data: null, error: null })
    ]);

    if (equipError) console.warn('equipment lookup failed (continuing):', equipError.message);
    if (articleError) console.warn('article lookup failed (continuing):', articleError.message);
    if (locationError) console.warn('location lookup failed (continuing):', locationError.message);
    if (caseError) console.warn('case lookup failed (continuing):', caseError.message);
    if (companyError) console.warn('company lookup failed (continuing):', companyError.message);

    // Build friendly entities
    let equipment: { name: string; id?: number } | null = null;
    let article: { name?: string } | null = null;
    let location: { name?: string } | null = null;
    let caseeq: { name?: string } | null = null;
    let company: { name?: string } | null = null;

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
    if (companyData) company = { name: companyData.name };

    // Fallback: if no company from companyData, try to get from related entities
    if (!company) {
      const companyId = equipmentData?.company_id || articleData?.company_id || locationData?.company_id || caseData?.company_id;
      if (companyId) {
        const { data: fallbackCompany } = await supabase.from('companies').select('name').eq('id', companyId).maybeSingle();
        if (fallbackCompany) company = { name: fallbackCompany.name };
      }
    }

    const placeholderData = getAssetTagPlaceholders(
      assetTag as { printed_code?: string | null },
      equipment,
      article,
      location,
      caseeq,
      company
    );
    const svgText = await generateSVG(templateJson, placeholderData);

    // Use dimensions from template or query params
    const finalWidth = widthMm || templateJson.tagWidthMm;
    const finalHeight = heightMm || templateJson.tagHeightMm;

    // Generate HTML page optimized for printing with exact dimensions
    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Asset Tag ${assetTag.printed_code || id}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    @page {
      size: ${finalWidth}mm ${finalHeight}mm;
      margin: 0;
    }
    
    body {
      margin: 0;
      padding: 0;
      width: ${finalWidth}mm;
      height: ${finalHeight}mm;
      display: flex;
      align-items: center;
      justify-content: center;
      background: white;
    }
    
    .asset-tag-container {
      width: ${finalWidth}mm;
      height: ${finalHeight}mm;
      display: flex;
      align-items: center;
      justify-content: center;
      page-break-after: always;
    }
    
    svg {
      width: 100%;
      height: 100%;
      display: block;
    }
    
    @media print {
      body {
        width: ${finalWidth}mm;
        height: ${finalHeight}mm;
      }
      
      .no-print {
        display: none !important;
      }
    }
    
    .print-button {
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #0070f3;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      z-index: 1000;
    }
    
    .print-button:hover {
      background: #0051cc;
    }
  </style>
</head>
<body>
  <button class="print-button no-print" onclick="window.print()">Drucken</button>
  <div class="asset-tag-container">
    ${svgText}
  </div>
  <script>
    // Auto-print after load (can be disabled if annoying)
    window.addEventListener('load', () => {
      setTimeout(() => {
        // Uncomment to enable auto-print:
        // window.print();
      }, 500);
    });
  </script>
</body>
</html>`;

    return new NextResponse(html, { 
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      } 
    });
  } catch (err) {
    console.error('print asset tag fatal error', err);
    return new NextResponse('Internal server error', { status: 500 });
  }
}
