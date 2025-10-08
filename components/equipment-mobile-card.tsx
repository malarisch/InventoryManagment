import { ReactNode } from 'react';
import Link from 'next/link';
import type { Tables } from '@/database.types';
import { MobileCard } from '@/components/ui/mobile-card';
import { formatDate, safeParseDate } from '@/lib/dates';

type EquipmentRow = Tables<"equipments"> & {
  articles?: { name: string } | null;
  asset_tags?: { printed_code: string | null } | null;
  current_location_location?: { id: number; name: string | null } | null;
};

interface EquipmentMobileCardProps {
  equipment: EquipmentRow;
  actions?: ReactNode;
  showFooter?: boolean;
  className?: string;
}

/**
 * Mobile card component for displaying equipment data.
 * Shows article name, location, and optional metadata in a responsive layout.
 * 
 * @param equipment - The equipment record with joined article and location data
 * @param actions - Optional action buttons (edit, delete, etc.)
 * @param showFooter - Whether to show ID, inventory date, and asset tag in footer
 */
export function EquipmentMobileCard({ 
  equipment, 
  actions, 
  showFooter = true,
  className 
}: EquipmentMobileCardProps) {
  const articleName = equipment.article_id ? (
    <Link 
      className="underline-offset-2 hover:underline" 
      href={`/management/articles/${equipment.article_id}`}
    >
      {equipment.articles?.name ?? `#${equipment.article_id}`}
    </Link>
  ) : '—';

  const locationName = equipment.current_location ? (
    <Link
      className="underline-offset-2 hover:underline"
      href={`/management/locations/${equipment.current_location}`}
    >
      {equipment.current_location_location?.name ?? `#${equipment.current_location}`}
    </Link>
  ) : '—';

  const fields = [
    {
      label: 'ID',
      value: (
        <Link 
          className="underline-offset-2 hover:underline" 
          href={`/management/equipments/${equipment.id}`}
        >
          {equipment.id}
        </Link>
      )
    },
    {
      label: 'Artikel',
      value: articleName
    },
    {
      label: 'Standort',
      value: locationName
    }
  ];

  const footerLeft: ReactNode = null;
  let footerRight: ReactNode = null;

  if (showFooter) {
    const assetTagCode = equipment.asset_tags?.printed_code ?? 
      (equipment.asset_tag !== null ? `#${equipment.asset_tag}` : null);
    const inventoryDate = equipment.added_to_inventory_at 
      ? formatDate(safeParseDate(equipment.added_to_inventory_at)) 
      : null;

    const parts: string[] = [];
    if (inventoryDate) parts.push(`Im Lager seit ${inventoryDate}`);
    if (assetTagCode) parts.push(`Asset-Tag ${assetTagCode}`);
    
    footerRight = parts.length > 0 ? parts.join(' • ') : null;
  }

  return (
    <MobileCard
      fields={fields}
      actions={actions}
      footerLeft={footerLeft}
      footerRight={footerRight}
      className={className}
    />
  );
}
