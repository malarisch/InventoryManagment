import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { EquipmentCreateForm } from "@/components/forms/equipment-create-form";

export default function EquipmentNewPage({ searchParams }: { searchParams?: { [key: string]: string | string[] | undefined } }) {
  const initialArticleId = typeof searchParams?.articleId === "string" ? Number(searchParams?.articleId) : undefined;
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-3xl flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/equipments" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neues Equipment erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <EquipmentCreateForm initialArticleId={initialArticleId} />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
