import {NextRequest, NextResponse} from 'next/server';
import {importCompanyData} from "@/lib/importexport";
import {createClient} from "@/lib/supabase/server";

/**
 * Recursively converts BigInt values to strings and Date objects to ISO strings for JSON serialization
 */
function convertBigIntToString(obj: unknown): unknown {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  // Handle Date objects by converting to ISO string
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => convertBigIntToString(item));
  }
  
  if (typeof obj === 'object') {
    const converted: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertBigIntToString(value);
    }
    return converted;
  }
  
  return obj;
}

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const companyImport = await req.json();
        const company = await importCompanyData(companyImport, user!.id as string);
        return NextResponse.json({ company: convertBigIntToString(company) });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }

}
