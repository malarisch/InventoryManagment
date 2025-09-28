import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { AssetTagCreateFormStandalone } from "@/components/forms/asset-tag-create-form-standalone";

export default function NewAssetTagPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/asset-tags" className="hover:underline">← Zurück zu Asset Tags</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neuer Asset Tag</CardTitle>
            <CardDescription>
              Erstellen Sie einen neuen Asset Tag mit Template
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AssetTagCreateFormStandalone />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}