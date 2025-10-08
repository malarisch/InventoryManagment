import { cookies } from "next/headers";
import { createClient as createServerClient } from "@/lib/supabase/server";

/**
 * Get the active company ID from cookie (server-side only).
 * Returns null if no cookie is set or if the user doesn't have access to that company.
 * Should be called from Server Components or API Routes.
 */
export async function getActiveCompanyId(): Promise<number | null> {
  const cookieStore = await cookies();
  const activeCompanyIdStr = cookieStore.get("active_company_id")?.value;
  
  if (!activeCompanyIdStr) {
    // No cookie set - try to get first available company
    const supabase = await createServerClient();
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) return null;
    
    // Get first company user has access to
    const { data: membership } = await supabase
      .from("users_companies")
      .select("company_id")
      .eq("user_id", auth.user.id)
      .limit(1)
      .maybeSingle();
    
    if (membership?.company_id) {
      return Number(membership.company_id);
    }
    
    // Fallback: get first owned company
    const { data: ownedCompany } = await supabase
      .from("companies")
      .select("id")
      .eq("owner_user_id", auth.user.id)
      .limit(1)
      .maybeSingle();
    
    return ownedCompany?.id ? Number(ownedCompany.id) : null;
  }
  
  const companyId = parseInt(activeCompanyIdStr, 10);
  if (isNaN(companyId)) return null;
  
  // Verify user has access to this company
  const supabase = await createServerClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return null;
  
  // Check membership or ownership
  const { data: membership } = await supabase
    .from("users_companies")
    .select("company_id")
    .eq("user_id", auth.user.id)
    .eq("company_id", companyId)
    .maybeSingle();
  
  if (membership) return companyId;
  
  // Check if user owns this company
  const { data: company } = await supabase
    .from("companies")
    .select("id")
    .eq("id", companyId)
    .eq("owner_user_id", auth.user.id)
    .maybeSingle();
  
  return company?.id ? Number(company.id) : null;
}
