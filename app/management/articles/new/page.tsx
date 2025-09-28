import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { ArticleCreateForm } from "@/components/forms/article-create-form";

export default function ArticleNewPage() {
  return (
    <div className="w-full space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/articles" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neuen Artikel erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <ArticleCreateForm />
          </CardContent>
        </Card>
    </div>
  );
}
