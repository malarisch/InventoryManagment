"use client"

import {createClient} from "@/lib/supabase/client";
import {redirect} from "next/navigation";
import Link from "next/link";
import {useMemo} from "react";
import {useCompany} from "@/app/management/_libs/companyHook";

export type companyType = {
    company: {
        id?: number,
        created_at?: number,
        name: string,
        description: string,
        owner_user_id?: string
        metadata?: object
    }
}

export function CompanyNameHeader() {
    // let companyDescription = null;
    // const supabase = useMemo(() => createClient(), []);
    // const getCompany = async () => {
    //     const user = await supabase.auth.getUser();
    //     const userCompany = await supabase.from("companies").select("*").eq("owner_user_id", user.data.user?.id).single();
    //     companyDescription = userCompany.data.description
    //     return userCompany.data.name
    // }
    const {company, loading, error} = useCompany();
    return <div className="flex h-14 items-center gap-2 border-b px-4">
        <div className="h-6 w-6 rounded-sm bg-emerald-500" />
        <div className="flex flex-col leading-tight">
            <span className="text-sm font-semibold"> {company?.company.name} </span>
            <span className="text-xs text-muted-foreground">{company?.company.description}</span>
        </div>
    </div>;
}