import { CustomerTable } from "@/components/customerTable";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CustomersPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Kunden</h1>
          <Button asChild>
            <Link href="/management/customers/new">Neu</Link>
          </Button>
        </div>
        <CustomerTable pageSize={10} />
      </div>
    </main>
  );
}
