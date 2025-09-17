import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { companyType } from "@/app/management/_libs/company-name-header";

export function useCompany() {
    const [company, setCompany] = useState<companyType | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<any>(null);

    useEffect(() => {
        const supabase = createClient();
        async function fetchCompany() {
            setLoading(true);
            const user = await supabase.auth.getUser();
            const { data, error } = await supabase
                .from("companies")
                .select("*")
                .eq("owner_user_id", user.data.user?.id)
                .single();
            if (error) setError(error);
            else setCompany({ company: data });
            setLoading(false);
        }
        fetchCompany();
    }, []);

    return { company, loading, error };
}
