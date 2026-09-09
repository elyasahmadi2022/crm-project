"use client"

import * as React from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import type { DateRange } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"

// ─────────────────────────────────────────────────
// Single-date picker
//
// Usage:
//   const [date, setDate] = React.useState<Date>()
//   <DatePicker value={date} onChange={setDate} placeholder="Pick a date" />
//
// Controlled from react-hook-form:
//   <DatePicker value={field.value} onChange={field.onChange} />
// ─────────────────────────────────────────────────

export interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  /** Format string passed to date-fns `format`. Defaults to "PPP" (e.g. "April 9, 2026"). */
  dateFormat?: string
  className?: string
  /** Disable specific dates — e.g. (date) => date < new Date() to block past dates. */
  disabledDates?: (date: Date) => boolean
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  disabled = false,
  dateFormat = "PPP",
  className,
  disabledDates,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal",
          !value && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        {value ? format(value, dateFormat) : <span>{placeholder}</span>}
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange?.(date)
            setOpen(false)
          }}
          disabled={disabledDates}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}

// ─────────────────────────────────────────────────
// Date-range picker
//
// Usage:
//   const [range, setRange] = React.useState<DateRange>()
//   <DateRangePicker value={range} onChange={setRange} />
// ─────────────────────────────────────────────────

export interface DateRangePickerProps {
  value?: DateRange
  onChange?: (range: DateRange | undefined) => void
  placeholder?: string
  disabled?: boolean
  dateFormat?: string
  className?: string
  disabledDates?: (date: Date) => boolean
  /** Number of calendar months shown side by side. Defaults to 2. */
  numberOfMonths?: number
}

export function DateRangePicker({
  value,
  onChange,
  placeholder = "Pick a date range",
  disabled = false,
  dateFormat = "LLL dd, y",
  className,
  disabledDates,
  numberOfMonths = 2,
}: DateRangePickerProps) {
  const label = React.useMemo(() => {
    if (!value?.from) return placeholder
    if (!value.to) return format(value.from, dateFormat)
    return `${format(value.from, dateFormat)} – ${format(value.to, dateFormat)}`
  }, [value, placeholder, dateFormat])

  return (
    <Popover>
      <PopoverTrigger
        disabled={disabled}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "w-full justify-start text-left font-normal",
          !value?.from && "text-muted-foreground",
          className,
        )}
      >
        <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
        <span>{label}</span>
      </PopoverTrigger>

      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="range"
          selected={value}
          onSelect={onChange}
          disabled={disabledDates}
          numberOfMonths={numberOfMonths}
          autoFocus
        />
      </PopoverContent>
    </Popover>
  )
}
