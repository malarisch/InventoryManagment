export default function ManagementHomePage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Willkommen im Management. Wähle einen Bereich in der Sidebar.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card title="Equipments" desc="Verwalte Geräte & Status" />
        <Card title="Articles" desc="Produktarten & Eigenschaften" />
        <Card title="Locations" desc="Standorte & Bewegungen" />
      </div>
    </div>
  );
}

function Card({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-lg border bg-card p-4">
      <div className="text-sm font-medium">{title}</div>
      <div className="text-xs text-muted-foreground">{desc}</div>
    </div>
  );
}

