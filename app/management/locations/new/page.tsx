import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { LocationCreateForm } from "@/components/forms/location-create-form";

export default function LocationNewPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/locations" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neuen Standort erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <LocationCreateForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

