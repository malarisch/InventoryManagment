import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";
import { JobCreateForm } from "@/components/forms/job-create-form";

export default function JobNewPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 space-y-4">
        <div className="text-sm text-muted-foreground">
          <Link href="/management/jobs" className="hover:underline">← Zurück zur Übersicht</Link>
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Neuen Job erstellen</CardTitle>
          </CardHeader>
          <CardContent>
            <JobCreateForm />
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

