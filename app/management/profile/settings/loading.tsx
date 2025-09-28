import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-7xl flex-1 space-y-6">
        <Skeleton className="h-72 w-full" aria-hidden="true" />
        <Skeleton className="h-60 w-full" aria-hidden="true" />
      </div>
    </main>
  );
}
