"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CalendarIcon, X } from "lucide-react";
import type { Locale } from "date-fns";
import { de } from "date-fns/locale";

import { safeParseDate } from "@/lib/dates";
import { cn } from "@/lib/utils";
import { Calendar } from "./calendar";

export interface DatePickerProps {
  id?: string;
  name?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  fromDate?: Date;
  toDate?: Date;
  className?: string;
  clearLabel?: string;
  locale?: Locale;
}

const defaultPlaceholder = "Datum wählen";

export function DatePicker({
  id,
  name,
  value,
  onChange,
  placeholder = defaultPlaceholder,
  disabled,
  required,
  fromDate,
  toDate,
  className,
  clearLabel = "Zurücksetzen",
  locale = de,
}: DatePickerProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [open, setOpen] = useState(false);

  const selectedDate = useMemo(() => safeParseDate(value ?? null), [value]);
  const displayValue = useMemo(() => formatDisplayDate(selectedDate, locale), [selectedDate, locale]);

  const toggle = useCallback(() => {
    if (disabled) return;
    setOpen((prev) => !prev);
  }, [disabled]);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function handleClick(event: MouseEvent) {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        close();
      }
    }
    function handleKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        close();
      }
    }
    document.addEventListener("mousedown", handleClick);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open, close]);

  const handleSelect = useCallback(
    (date?: Date) => {
      if (!date) {
        onChange("");
      } else {
        const iso = toISODateString(date);
        onChange(iso);
      }
      close();
    },
    [close, onChange],
  );

  const handleClear = useCallback(() => {
    onChange("");
    close();
  }, [close, onChange]);

  const popoverId = id ? `${id}-popover` : undefined;

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <button
        type="button"
        id={id}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={popoverId}
        onClick={toggle}
        disabled={disabled}
        className={cn(
          "flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 text-left text-sm shadow-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
        )}
      >
        <span className={cn("truncate", !displayValue && "text-muted-foreground")}>{displayValue || placeholder}</span>
        <div className="inline-flex items-center gap-2 pl-2 text-muted-foreground">
          {value && !disabled ? (
            <span
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                handleClear();
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  event.stopPropagation();
                  handleClear();
                }
              }}
              className="flex h-6 w-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground transition hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              aria-label={clearLabel}
            >
              <X className="h-3.5 w-3.5" strokeWidth={2} />
            </span>
          ) : null}
          <CalendarIcon className="h-4 w-4" aria-hidden="true" />
        </div>
      </button>
      <input type="hidden" name={name} value={value} required={required} />
      {open ? (
        <div
          id={popoverId}
          role="dialog"
          className="absolute left-0 z-50 mt-2 w-[280px] rounded-md border bg-popover p-3 shadow-lg focus:outline-none"
        >
          <Calendar
            mode="single"
            selected={selectedDate ?? undefined}
            onSelect={handleSelect}
            defaultMonth={selectedDate ?? undefined}
            locale={locale}
            fromDate={fromDate}
            toDate={toDate}
            initialFocus
            weekStartsOn={1}
          />
          <div className="mt-2 flex justify-end">
            <button
              type="button"
              onClick={handleClear}
              className="text-xs text-muted-foreground underline-offset-2 hover:underline"
            >
              {clearLabel}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function toISODateString(date: Date): string {
  const copy = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  return copy.toISOString().slice(0, 10);
}

function formatDisplayDate(date: Date | null, locale: Locale): string {
  if (!date) return "";
  try {
    return new Intl.DateTimeFormat(locale.code ?? "de-DE", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    return "";
  }
}
