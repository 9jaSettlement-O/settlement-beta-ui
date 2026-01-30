import * as React from "react"
import { format } from "date-fns"
import { Calendar as CalendarIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"

interface DatePickerProps {
  date?: Date | null
  onDateChange: (date: Date | undefined) => void
  placeholder?: string
  maxDate?: Date
  minDate?: Date
  disabled?: boolean
  required?: boolean
  className?: string
  openToDate?: Date
}

export function DatePicker({
  date,
  onDateChange,
  placeholder = "Pick a date",
  maxDate,
  minDate,
  disabled = false,
  required = false,
  className,
  openToDate,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full justify-start text-left font-normal",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "MMMM dd, yyyy") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={date || undefined}
          onSelect={(selectedDate) => {
            onDateChange(selectedDate)
            setOpen(false)
          }}
          disabled={(date) => {
            if (maxDate && date > maxDate) return true
            if (minDate && date < minDate) return true
            return false
          }}
          defaultMonth={openToDate || date || undefined}
          initialFocus
          captionLayout="dropdown"
          startMonth={minDate ?? new Date(1900, 0)}
          endMonth={maxDate ?? new Date(new Date().getFullYear() + 1, 11)}
        />
      </PopoverContent>
    </Popover>
  )
}
