import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/server";
import type { Tables } from "@/database.types";
import Link from "next/link";
import { formatDateTime, safeParseDate } from "@/lib/dates";
import { Badge } from "@/components/ui/badge";

type WorkshopTodo = Tables<"workshop_todos">;

interface WorkshopTodosCardProps {
  equipmentId: number;
  companyId: number;
}

const STATUS_LABELS: Record<string, string> = {
  open: "Offen",
  in_progress: "In Bearbeitung",
  done: "Abgeschlossen",
  blocked: "Blockiert",
};

const STATUS_VARIANTS: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  open: "destructive",
  in_progress: "default",
  done: "secondary",
  blocked: "outline",
};

export async function WorkshopTodosCard({ equipmentId, companyId }: WorkshopTodosCardProps) {
  const supabase = await createClient();
  
  // Fetch open/in-progress workshop todos for this equipment
  const { data: todos } = await supabase
    .from("workshop_todos")
    .select("*")
    .eq("equipment_id", equipmentId)
    .eq("company_id", companyId)
    .in("status", ["open", "in_progress"])
    .order("created_at", { ascending: false });

  const todosList = (todos as WorkshopTodo[] | null) ?? [];
  const openCount = todosList.filter(t => t.status === "open").length;
  const inProgressCount = todosList.filter(t => t.status === "in-progress").length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Offene Werkstatt-Jobs</CardTitle>
        <CardDescription>
          {todosList.length === 0 ? (
            "Keine offenen Werkstatt-Jobs"
          ) : (
            `${openCount} offen, ${inProgressCount} in Bearbeitung`
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {todosList.length === 0 ? (
          <p className="text-sm text-muted-foreground">Dieses Equipment hat keine offenen Werkstatt-Jobs.</p>
        ) : (
          <div className="space-y-3">
            {todosList.map((todo) => (
              <div key={todo.id} className="border rounded-lg p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <Link 
                      href={`/management/workshop`}
                      className="font-medium hover:underline text-sm block truncate"
                    >
                      {todo.title}
                    </Link>
                    {todo.notes && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {todo.notes}
                      </p>
                    )}
                  </div>
                  <Badge variant={STATUS_VARIANTS[todo.status] || "default"}>
                    {STATUS_LABELS[todo.status] || todo.status}
                  </Badge>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span>Erstellt: {formatDateTime(safeParseDate(todo.created_at))}</span>
                  {todo.due_date && (
                    <>
                      <span>•</span>
                      <span>Fällig: {formatDateTime(safeParseDate(todo.due_date))}</span>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
