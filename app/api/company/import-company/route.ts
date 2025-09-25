import {NextRequest, NextResponse} from 'next/server';
import {importCompanyData} from "@/lib/importexport";

export async function POST(req: NextRequest) {
    try {
        const companyImport = await req.json();
        const company = await importCompanyData(companyImport);
        return NextResponse.json({ company });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }

}
