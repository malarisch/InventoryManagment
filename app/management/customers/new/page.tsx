import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CustomerCreateForm } from "@/components/forms/customer-create-form";

export default function CustomerNewPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/customers" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neuen Kunden erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <CustomerCreateForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

