import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AssetTagTable } from "@/components/assetTagTable";

export default function AssetTagsPage() {
  return (
    <main className="min-h-screen w-full flex flex-col items-center p-5">
      <div className="w-full max-w-none flex-1 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Asset Tags</h1>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href="/management/asset-tag-templates/new" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Template erstellen
              </Link>
            </Button>
            <Button asChild>
              <Link href="/management/asset-tags/new" className="flex items-center gap-2">
                <Plus className="w-4 h-4" />
                Asset Tag
              </Link>
            </Button>
          </div>
        </div>
        <AssetTagTable pageSize={20} />
      </div>
    </main>
  );
}