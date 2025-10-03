import {NextRequest, NextResponse} from 'next/server';
import {getCompanyData} from "@/lib/importexport";
import {createClient} from "@/lib/supabase/server";

/**
 * GET /api/company/dump-company
 * 
 * Exports company data as JSON for backup/migration purposes.
 * Requires authentication and company membership.
 * 
 * @param companyId - Optional query parameter. If not provided, uses user's first company.
 * @returns JSON with full company data including all related entities
 */
export async function GET(req: NextRequest) {
  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: "Nicht authentifiziert" }, { status: 401 });
    }

    // Get company ID from query or find user's first company
    let companyId = req.nextUrl.searchParams.get('companyId');
    
    if (!companyId) {
      // Find user's first company from membership
      const { data: membership } = await supabase
        .from("users_companies")
        .select("company_id")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      
      if (membership?.company_id) {
        companyId = membership.company_id.toString();
      } else {
        // Try owned companies
        const { data: owned } = await supabase
          .from("companies")
          .select("id")
          .eq("owner_user_id", user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();
        
        if (owned?.id) {
          companyId = owned.id.toString();
        }
      }
    }

    if (!companyId) {
      return NextResponse.json({ error: "Keine Company gefunden" }, { status: 404 });
    }

    // Verify user has access to this company
    const { data: hasAccess } = await supabase
      .from("users_companies")
      .select("company_id")
      .eq("company_id", companyId)
      .eq("user_id", user.id)
      .maybeSingle();

    const { data: isOwner } = await supabase
      .from("companies")
      .select("id")
      .eq("id", companyId)
      .eq("owner_user_id", user.id)
      .maybeSingle();

    if (!hasAccess && !isOwner) {
      return NextResponse.json({ error: "Zugriff verweigert" }, { status: 403 });
    }

    // Get company data using Prisma
    const company = await getCompanyData(companyId);
    
    if (!company) {
      return NextResponse.json({ error: "Company nicht gefunden" }, { status: 404 });
    }

    return NextResponse.json({ company });

  } catch (e) {
    console.error("Export error:", e);
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
