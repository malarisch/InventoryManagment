import {NextRequest, NextResponse} from 'next/server';
import {importCompanyData} from "@/lib/importexport";
import {createClient} from "@/lib/supabase/server";

export async function POST(req: NextRequest) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        const companyImport = await req.json();
        const company = await importCompanyData(companyImport, user!.id as string);
        return NextResponse.json({ company });

    } catch (e) {
        console.error(e);
        return NextResponse.json({ error: (e as Error).message }, { status: 500 });
    }

}
