import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CompanyCreateForm } from "@/components/forms/company-create-form";

export default function CompanyNewPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management" className="hover:underline">← Zurück</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neue Company anlegen</CardTitle>
          </CardHeader>
          <CardContent>
            <CompanyCreateForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

