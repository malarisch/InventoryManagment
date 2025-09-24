"use client";

import { DataTable } from "@/components/data-table";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import type { Tables } from "@/database.types";
import { MoreHorizontal, Eye, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

type AssetTagRow = Tables<"asset_tags"> & {
  printed_template_relation?: { 
    id: number;
    template: { name: string } | null; 
  } | null;
  // References to entities using this asset tag
  articles?: Array<{ id: number; name: string }>;
  equipments?: Array<{ id: number; articles?: { name: string } | null }>;
  locations?: Array<{ id: number; name: string | null }>;
};

interface Props {
  pageSize?: number;
  className?: string;
}

export function AssetTagTable({ pageSize = 10, className }: Props) {
  const columns = [
    { 
      key: "id", 
      label: "ID",
      render: (row: AssetTagRow) => `#${row.id}`
    },
    { 
      key: "printed_code", 
      label: "Code",
      render: (row: AssetTagRow) => row.printed_code || "—"
    },
    { 
      key: "printed_applied", 
      label: "Status",
      render: (row: AssetTagRow) => (
        <span className={`px-2 py-1 rounded-full text-xs ${
          row.printed_applied 
            ? "bg-green-100 text-green-800" 
            : "bg-gray-100 text-gray-800"
        }`}>
          {row.printed_applied ? "Angebracht" : "Verfügbar"}
        </span>
      )
    },
    { 
      key: "printed_template", 
      label: "Template",
      render: (row: AssetTagRow) => {
        const template = row.printed_template_relation;
        return template?.template?.name || "—";
      }
    },
    { 
      key: "usage", 
      label: "Verwendet von",
      render: (row: AssetTagRow) => {
        const articles = row.articles || [];
        const equipments = row.equipments || [];
        const locations = row.locations || [];
        
        const totalUsage = articles.length + equipments.length + locations.length;
        
        if (totalUsage === 0) return "—";
        
        const usageItems = [
          ...articles.map(a => ({ type: "article", id: a.id, name: a.name })),
          ...equipments.map(e => ({ type: "equipment", id: e.id, name: e.articles?.name || `Equipment #${e.id}` })),
          ...locations.map(l => ({ type: "location", id: l.id, name: l.name || `Standort #${l.id}` }))
        ];
        
        return (
          <div className="flex flex-col gap-1">
            {usageItems.slice(0, 2).map((item) => (
              <Link 
                key={`${item.type}-${item.id}`}
                href={`/management/${item.type}s/${item.id}`}
                className="text-blue-600 hover:underline text-xs"
              >
                {item.name}
              </Link>
            ))}
            {totalUsage > 2 && (
              <span className="text-xs text-gray-500">+{totalUsage - 2} weitere</span>
            )}
          </div>
        );
      }
    },
    { 
      key: "created_at", 
      label: "Erstellt",
      render: (row: AssetTagRow) => new Date(row.created_at).toLocaleDateString("de-DE")
    },
  ];

  const renderRowActions = (row: AssetTagRow) => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 p-0">
          <span className="sr-only">Aktionen öffnen</span>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/management/asset-tags/${row.id}`} className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            Anzeigen
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/management/asset-tags/${row.id}/edit`} className="flex items-center">
            <Edit className="mr-2 h-4 w-4" />
            Bearbeiten
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/api/asset-tags/${row.id}/render?format=svg`} target="_blank" className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            Vorschau (SVG)
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild>
          <Link href={`/api/asset-tags/${row.id}/render?format=png`} target="_blank" className="flex items-center">
            <Eye className="mr-2 h-4 w-4" />
            Vorschau (PNG)
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="text-red-600">
          <Trash2 className="mr-2 h-4 w-4" />
          Löschen
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <DataTable<AssetTagRow>
      tableName="asset_tags"
      columns={columns}
      renderRowActions={renderRowActions}
      pageSize={pageSize}
      className={className}
      searchableFields={[
        { field: 'id', type: 'number' },
        { field: 'printed_code', type: 'text' },
      ]}
      select={`
        *, 
        printed_template_relation:asset_tag_templates!printed_template(id, template),
        articles:articles!asset_tag(id, name),
        equipments:equipments!asset_tag(id, articles(name)),
        locations:locations!asset_tag(id, name)
      `}
    />
  );
}