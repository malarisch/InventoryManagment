import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/database.types";

export type CompanyRecord = Tables<"companies">;

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
            .maybeSingle();
          if (desiredError) {
            // ignore and fall through
          } else if (desired) {
            setCompany(desired as CompanyRecord);
            return;
          }
        }

        // Prefer the first company membership entry.
        const { data, error } = await supabase
          .from("users_companies")
          .select("companies(*)")
          .eq("user_id", auth.user.id)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) {
          setError(error.message);
          setCompany(null);
          return;
        }

        if (data?.companies) {
          const comp = (data as any).companies as unknown;
          const picked = (Array.isArray(comp) ? comp[0] : comp) as CompanyRecord | undefined;
          if (picked) {
            setCompany(picked);
            if (typeof window !== "undefined" && !desiredId) {
              try { localStorage.setItem("active_company_id", String(picked.id)); } catch {}
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
          .maybeSingle();

        if (ownedError) {
          setError(ownedError.message);
          setCompany(null);
        } else {
          setCompany((owned as CompanyRecord | null) ?? null);
        }
      } finally {
        setLoading(false);
      }
    }

    fetchCompany();
  }, []);

  return { company, loading, error };
}
