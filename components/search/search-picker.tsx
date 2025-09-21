"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";

import { cn } from "@/lib/utils";

export type SearchMatcher = {
  value: string;
  weight?: number;
};

export type SearchItem<TCategory extends string, TData> = {
  id: string;
  category: TCategory;
  title: string;
  description?: string;
  meta?: string;
  priority?: number;
  matchers: SearchMatcher[];
  data: TData;
  disabled?: boolean;
};

type SearchPickerProps<TCategory extends string, TData> = {
  items: Array<SearchItem<TCategory, TData>>;
  onSelect: (item: SearchItem<TCategory, TData>) => void;
  categoryLabels?: Partial<Record<TCategory, string>>;
  placeholder?: string;
  emptyLabel?: string;
  initialLimitPerCategory?: number;
  className?: string;
  disabled?: boolean;
  onQueryChange?: (query: string) => void;
  buttonLabel?: string;
  resetOnSelect?: boolean;
};

type RankedItem<TCategory extends string, TData> = {
  item: SearchItem<TCategory, TData>;
  score: number;
};

type GroupedResults<TCategory extends string, TData> = Array<{
  category: TCategory;
  label: string;
  items: Array<RankedItem<TCategory, TData>>;
}>;

const defaultPlaceholder = "Suche…";
const defaultEmpty = "Keine Treffer";
const defaultLimit = 5;
const basePriority = 5;
const weightExact = 0;
const weightPrefix = 10;
const weightContains = 30;

export function SearchPicker<TCategory extends string, TData>({
  items,
  onSelect,
  categoryLabels,
  placeholder = defaultPlaceholder,
  emptyLabel = defaultEmpty,
  initialLimitPerCategory = defaultLimit,
  className,
  disabled,
  onQueryChange,
  buttonLabel,
  resetOnSelect = true,
}: SearchPickerProps<TCategory, TData>) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState<number>(0);

  const { groups, flat } = useMemo(() => {
    const trimmed = query.trim().toLowerCase();
    const base = items.map((item, index) => ({
      item,
      baseScore: ((item.priority ?? basePriority) * 1000) + index,
    }));

    const order = categoryOrder(items, categoryLabels);

    if (trimmed.length === 0) {
      const grouped: GroupedResults<TCategory, TData> = [];
      for (const category of order) {
        const label = categoryLabels?.[category] ?? category;
        const relevant = base
          .filter((entry) => entry.item.category === category && !entry.item.disabled)
          .sort((a, b) => a.baseScore - b.baseScore)
          .slice(0, initialLimitPerCategory)
          .map<RankedItem<TCategory, TData>>((entry) => ({
            item: entry.item,
            score: entry.baseScore,
          }));
        if (relevant.length > 0) {
          grouped.push({ category, label, items: relevant });
        }
      }
      const flatList = grouped.flatMap((group) => group.items);
      return { groups: grouped, flat: flatList };
    }

    const matched: RankedItem<TCategory, TData>[] = [];
    for (const entry of base) {
      if (entry.item.disabled) continue;
      let best: number | null = null;
      for (const matcher of entry.item.matchers) {
        const value = matcher.value?.toLowerCase();
        if (!value) continue;
        if (value === trimmed) {
          const score = entry.baseScore + (matcher.weight ?? weightExact);
          best = best === null ? score : Math.min(best, score);
          continue;
        }
        if (value.startsWith(trimmed)) {
          const score = entry.baseScore + (matcher.weight ?? weightPrefix);
          best = best === null ? score : Math.min(best, score);
          continue;
        }
        if (value.includes(trimmed)) {
          const score = entry.baseScore + (matcher.weight ?? weightContains);
          best = best === null ? score : Math.min(best, score);
        }
      }
      if (best !== null) {
        matched.push({ item: entry.item, score: best });
      }
    }

    matched.sort((a, b) => a.score - b.score);

    const grouped: GroupedResults<TCategory, TData> = [];
    for (const category of order) {
      const label = categoryLabels?.[category] ?? category;
      const relevant = matched.filter((entry) => entry.item.category === category);
      if (relevant.length > 0) {
        grouped.push({ category, label, items: relevant });
      }
    }
    const flatList = grouped.flatMap((group) => group.items);
    return { groups: grouped, flat: flatList };
  }, [items, query, categoryLabels, initialLimitPerCategory]);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query]);

  const handleOpen = useCallback(() => {
    if (disabled) return;
    setOpen(true);
  }, [disabled]);

  const updateQuery = useCallback(
    (value: string) => {
      setQuery(value);
      onQueryChange?.(value);
    },
    [onQueryChange],
  );

  const handleSelect = useCallback(
    (item: SearchItem<TCategory, TData>) => {
      onSelect(item);
      setOpen(false);
      if (resetOnSelect) {
        updateQuery("");
      }
    },
    [onSelect, resetOnSelect, updateQuery],
  );

  const handleKeyNavigation = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((prev) => (flat.length === 0 ? 0 : Math.min(flat.length - 1, prev + 1)));
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((prev) => (flat.length === 0 ? 0 : Math.max(0, prev - 1)));
      } else if (event.key === "Enter" && flat[activeIndex]) {
        event.preventDefault();
        handleSelect(flat[activeIndex].item);
      }
    },
    [flat, activeIndex, handleSelect],
  );

  const currentActiveId = flat[activeIndex]?.item.id;
  const hasButtonLabel = Boolean(buttonLabel && buttonLabel.trim().length > 0);
  const buttonText = hasButtonLabel ? buttonLabel! : placeholder;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center gap-2 rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
        <span className={cn("truncate", hasButtonLabel ? undefined : "text-muted-foreground")}>{buttonText}</span>
      </button>
      {open ? (
        <div className="absolute left-0 z-50 mt-2 w-full min-w-[320px] max-w-[480px] rounded-md border bg-popover shadow-lg">
          <div className="flex items-center gap-2 border-b px-3 py-2">
            <Search className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
            <input
              ref={inputRef}
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              onKeyDown={handleKeyNavigation}
              placeholder={placeholder}
              className="h-8 w-full bg-transparent text-sm outline-none"
            />
            {query.length > 0 ? (
              <button
                type="button"
                onClick={() => updateQuery("")}
                className="rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
                aria-label="Zurücksetzen"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : null}
          </div>
          <div className="max-h-80 overflow-y-auto p-2">
            {flat.length === 0 ? (
              <div className="px-2 py-6 text-center text-sm text-muted-foreground">{emptyLabel}</div>
            ) : (
              groups.map((group) => (
                <div key={group.category} className="mb-3 last:mb-0">
                  <div className="px-2 pb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {group.label}
                  </div>
                  <ul className="space-y-1">
                    {group.items.map((entry) => (
                      <li key={entry.item.id}>
                        <button
                          type="button"
                          onClick={() => handleSelect(entry.item)}
                          className={cn(
                            "w-full rounded-md px-3 py-2 text-left text-sm transition hover:bg-accent hover:text-accent-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring",
                            currentActiveId === entry.item.id && "bg-accent text-accent-foreground",
                          )}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-medium">{entry.item.title}</span>
                            {entry.item.meta ? (
                              <span className="text-xs text-muted-foreground">{entry.item.meta}</span>
                            ) : null}
                          </div>
                          {entry.item.description ? (
                            <div className="mt-1 text-xs text-muted-foreground">
                              {entry.item.description}
                            </div>
                          ) : null}
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function categoryOrder<TCategory extends string, TData>(
  items: Array<SearchItem<TCategory, TData>>,
  labels?: Partial<Record<TCategory, string>>,
): TCategory[] {
  const seen = new Set<TCategory>();
  const order: TCategory[] = [];
  if (labels) {
    for (const key of Object.keys(labels) as TCategory[]) {
      if (!seen.has(key)) {
        seen.add(key);
        order.push(key);
      }
    }
  }
  for (const item of items) {
    if (!seen.has(item.category)) {
      seen.add(item.category);
      order.push(item.category);
    }
  }
  return order;
}
