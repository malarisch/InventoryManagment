"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { useCallback, useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';

import { normalizeCompanyRelation, type CompanyRecord } from '@/lib/companies';
import { FileManager } from '@/components/files/file-manager';


export function CompanyFiles() {
      const [company, setCompany] = useState<CompanyRecord | null>(null);
    
      const supabase = createClient();
    
      const loadFiles = useCallback(async () => {
        
        const { data: auth } = await supabase.auth.getUser();
              const userId = auth.user?.id;
              if (!userId) {
                return;
              }
              type MembershipRow = { companies: CompanyRecord | CompanyRecord[] | null };
              const { data: membership, error: membershipError } = await supabase
                .from("users_companies")
                .select("companies(*)")
                .eq("user_id", userId)
                .order("created_at", { ascending: true })
                .limit(1)
                .maybeSingle<MembershipRow>();
        
              
        
              let targetCompany: CompanyRecord | null = null;
              if (membershipError && membershipError.code !== "PGRST116") {
                return;
              } else if (membership?.companies) {
                targetCompany = normalizeCompanyRelation(membership.companies);
              }
        
              if (!targetCompany) {
                const { data: owned, error: ownedError } = await supabase
                  .from("companies")
                  .select("*")
                  .eq("owner_user_id", userId)
                  .order("created_at", { ascending: true })
                  .limit(1)
                  .maybeSingle<CompanyRecord>();
                if (ownedError && ownedError.code !== "PGRST116") {
                    return;
                } else if (owned) {
                  targetCompany = owned;
                }
              }
        
              if (targetCompany) {
                setCompany(targetCompany);
              }
      }, [supabase]);

      useEffect(() => {
        loadFiles();
      }, [loadFiles]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dateien</CardTitle>
        <CardDescription>Dateien der Company verwalten</CardDescription>
      </CardHeader>
      <CardContent>
        {company && (
          <div className="mt-4 border-t pt-4">
            <FileManager
              table="companies"
              rowId={company.id}
              companyId={company.id}
              initial={company.files}
                showTitle={false}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
