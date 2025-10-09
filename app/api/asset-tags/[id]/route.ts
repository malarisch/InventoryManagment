import {createClient} from '@/lib/supabase/server';
import {NextRequest, NextResponse} from 'next/server';
import {getActiveCompanyId} from '@/lib/companies.server';

export async function GET(_req: NextRequest, context: { params: Promise<{ id: string }> })  {
  try {
    const supabase = await createClient();
    const { id } = await context.params;
    const activeCompanyId = await getActiveCompanyId();

    if (!activeCompanyId) {
      return NextResponse.json({ error: 'No active company' }, { status: 403 });
    }

    // Fetch asset tag with template
    const { data: assetTag, error } = await supabase
      .from('asset_tags')
      .select('*, asset_tag_templates!printed_template(template)')
      .eq('id', id)
      .eq('company_id', activeCompanyId)
      .maybeSingle();

    if (error) {
      console.error('asset_tag query error', error);
      return NextResponse.json({ error: 'Asset tag not found' }, { status: 404 });
    }

    if (!assetTag) {
      return NextResponse.json({ error: 'Asset tag not found' }, { status: 404 });
    }

    // Extract template from join
    const template = (assetTag as unknown as { asset_tag_templates?: { template?: unknown } })
      .asset_tag_templates?.template ?? null;

    // Return asset tag with printed_template as the template object
    const response = {
      ...assetTag,
      printed_template: template,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error('get asset tag fatal error', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
