import { JobTable } from "@/components/jobTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function JobsPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Jobs</h1>
          <Button asChild>
            <Link href="/management/jobs/new">Neu</Link>
          </Button>
        </div>
        <JobTable pageSize={10} />
      </div>
    </main>
  );
}
