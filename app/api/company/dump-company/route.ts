import {NextRequest, NextResponse} from 'next/server';
import {getCompanyData} from "@/lib/importexport";

export async function GET(req: NextRequest) {
  try {
    const companyDumpId = req.nextUrl.searchParams.get('companyDumpId');
    const company = await getCompanyData(companyDumpId as string);
    return NextResponse.json({ company });

  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }

}
