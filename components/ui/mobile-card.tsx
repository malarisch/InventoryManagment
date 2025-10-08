import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface MobileCardField {
  label: string;
  value: ReactNode;
}

interface MobileCardProps {
  fields: MobileCardField[];
  actions?: ReactNode;
  footerLeft?: ReactNode;
  footerRight?: ReactNode;
  className?: string;
}

/**
 * Generic mobile card component for displaying entity data in a responsive layout.
 * Used across the app for consistent mobile views of equipments, articles, locations, etc.
 * 
 * Features:
 * - Groups fields in rows of 3 columns on wider mobile screens
 * - Optional actions slot (typically edit/delete buttons)
 * - Optional footer for additional metadata (ID, dates, tags, etc.)
 */
export function MobileCard({ fields, actions, footerLeft, footerRight, className }: MobileCardProps) {
  // Group fields into rows of 3
  const groupedFields: MobileCardField[][] = [];
  for (let i = 0; i < fields.length; i += 3) {
    groupedFields.push(fields.slice(i, i + 3));
  }

  const showLeft = footerLeft !== null && footerLeft !== undefined && footerLeft !== '';
  const showRight = footerRight !== null && footerRight !== undefined && footerRight !== '';
  const showFooter = showLeft || showRight;

  return (
    <div className={cn('rounded-md border p-2.5', className)} data-testid="data-table-mobile-card">
      <div className="flex items-start justify-between gap-2">
        {groupedFields.length > 0 ? (
          <dl className="flex-1 space-y-2 text-xs">
            {groupedFields.map((group, groupIndex) => (
              <div key={groupIndex} className="grid grid-cols-3 gap-x-3 gap-y-1.5">
                {group.map((field, fieldIndex) => (
                  <div
                    key={fieldIndex}
                    className={cn('space-y-0.5', group.length === 1 ? 'col-span-3' : undefined)}
                  >
                    <dt className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                      {field.label}
                    </dt>
                    <dd className="text-sm font-medium leading-tight text-foreground break-words">
                      {field.value}
                    </dd>
                  </div>
                ))}
              </div>
            ))}
          </dl>
        ) : (
          <div className="flex-1" />
        )}
        {actions && (
          <div className="shrink-0 pt-0.5">
            {actions}
          </div>
        )}
      </div>
      {showFooter && (
        <div
          className={cn(
            'mt-1 flex items-center gap-2 text-[11px] text-muted-foreground',
            showRight ? 'justify-between' : 'justify-start'
          )}
        >
          {showLeft && <div>{footerLeft}</div>}
          {showRight && <div className="text-right">{footerRight}</div>}
        </div>
      )}
    </div>
  );
}
