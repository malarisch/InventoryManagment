import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { CompanyRecord } from "@/lib/companies";
import { normalizeCompanyRelation } from "@/lib/companies";

export type { CompanyRecord } from "@/lib/companies";

export function useCompany() {
  const [company, setCompany] = useState<CompanyRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();

    async function fetchCompany() {
      setLoading(true);
      setError(null);
      try {
        const { data: auth } = await supabase.auth.getUser();
        if (!auth.user) {
          setCompany(null);
          setError("Nicht angemeldet");
          return;
        }

        // If a preferred company was selected, prefer it
        const desiredRaw =
          typeof window !== "undefined" ? localStorage.getItem("active_company_id") : null;
        const desiredId = desiredRaw != null ? Number(desiredRaw) : NaN;
        if (!Number.isNaN(desiredId)) {
          const { data: desired, error: desiredError } = await supabase
            .from("companies")
            .select("*")
            .eq("id", desiredId)
            .maybeSingle<CompanyRecord>();
          if (desiredError) {
            // ignore and fall through
          } else if (desired) {
            setCompany(desired);
            // Ensure cookie is synced with localStorage
            if (typeof window !== "undefined") {
              document.cookie = `active_company_id=${desiredId}; path=/; max-age=31536000; SameSite=Lax`;
            }
            return;
          }
        }

        // Prefer the first company membership entry.
        type MembershipRow = { companies: CompanyRecord | CompanyRecord[] | null };
        const { data, error } = await supabase
          .from("users_companies")
          .select("companies(*)")
          .eq("user_id", auth.user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle<MembershipRow>();

        if (error) {
          setError(error.message);
          setCompany(null);
          return;
        }

        if (data?.companies) {
          const picked = normalizeCompanyRelation(data.companies);
          if (picked) {
            setCompany(picked);
            if (typeof window !== "undefined" && !desiredId) {
              try { 
                localStorage.setItem("active_company_id", String(picked.id));
                document.cookie = `active_company_id=${picked.id}; path=/; max-age=31536000; SameSite=Lax`;
              } catch {}
            }
            return;
          }
        }

        // Fallback: look for a company the user owns (in case membership rows are missing yet).
        const { data: owned, error: ownedError } = await supabase
          .from("companies")
          .select("*")
          .eq("owner_user_id", auth.user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle<CompanyRecord>();

        if (ownedError) {
          setError(ownedError.message);
          setCompany(null);
        } else {
          setCompany(owned ?? null);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, []);

  return { company, loading, error };
}
