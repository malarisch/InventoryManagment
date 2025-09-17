import { LocationTable } from "@/components/locationTable";

export default function LocationsPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-5xl flex-1 flex flex-col gap-4">
        <h1 className="text-2xl font-semibold">Standorte</h1>
        <LocationTable pageSize={10} />
      </div>
    </main>
  );
}

