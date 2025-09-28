import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { CaseCreateForm } from "@/components/forms/case-create-form";

export default function CaseNewPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-7xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management" className="hover:underline">← Zurück</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neuen Case erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <CaseCreateForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

