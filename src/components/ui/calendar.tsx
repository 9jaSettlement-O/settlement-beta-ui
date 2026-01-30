import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker, useDayPicker, type DropdownProps } from "react-day-picker"
import "react-day-picker/dist/style.css"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

/** Year selector as [<] Year [>] chevrons instead of a dropdown. */
function YearChevronsDropdown(props: DropdownProps) {
  const {
    value,
    options,
    "aria-label": ariaLabel,
    disabled,
    className,
    style,
  } = props
  const { goToMonth, months } = useDayPicker()
  const year = value ?? new Date().getFullYear()
  const currentMonth = months[0]?.date ?? new Date()
  const month = currentMonth.getMonth()
  const minYear = options?.[0]?.value
  const maxYear = options?.length ? options[options.length - 1]?.value : undefined
  const canGoPrev = !disabled && (minYear == null || year > minYear)
  const canGoNext = !disabled && (maxYear == null || year < maxYear)
  const goPrev = () => canGoPrev && goToMonth(new Date(year - 1, month))
  const goNext = () => canGoNext && goToMonth(new Date(year + 1, month))

  return (
    <div
      role="group"
      aria-label={ariaLabel}
      className={cn("flex items-center gap-1", className)}
      style={style}
    >
      <button
        type="button"
        aria-label={`Previous year (${year - 1})`}
        disabled={!canGoPrev}
        onClick={goPrev}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 shrink-0 rounded-md p-0 opacity-70 hover:opacity-100 disabled:opacity-50"
        )}
      >
        <ChevronLeft className="h-4 w-4" />
      </button>
      <span className="min-w-[3.5rem] text-center text-sm font-medium tabular-nums">
        {year}
      </span>
      <button
        type="button"
        aria-label={`Next year (${year + 1})`}
        disabled={!canGoNext}
        onClick={goNext}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "h-9 w-9 shrink-0 rounded-md p-0 opacity-70 hover:opacity-100 disabled:opacity-50"
        )}
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

export type CalendarProps = React.ComponentProps<typeof DayPicker>

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout,
  components: componentsProp,
  ...props
}: CalendarProps) {
  const useYearChevrons =
    captionLayout === "dropdown" || captionLayout === "dropdown-years"
  const components = React.useMemo(
    () => ({
      IconLeft: () => <ChevronLeft className="h-4 w-4" />,
      IconRight: () => <ChevronRight className="h-4 w-4" />,
      ...(useYearChevrons ? { YearsDropdown: YearChevronsDropdown } : {}),
      ...componentsProp,
    }),
    [useYearChevrons, componentsProp]
  )

  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      navLayout="around"
      captionLayout={captionLayout}
      hideNavigation={useYearChevrons}
      className={cn("p-3", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 relative",
        month_caption: "flex justify-center items-center h-11 relative gap-3",
        caption_label: "text-sm font-medium",
        nav: "flex items-center",
        button_previous: cn(
          buttonVariants({ variant: "outline" }),
          "absolute left-0 top-0 h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-md"
        ),
        button_next: cn(
          buttonVariants({ variant: "outline" }),
          "absolute right-0 top-0 h-9 w-9 bg-transparent p-0 opacity-70 hover:opacity-100 rounded-md"
        ),
        dropdowns: "flex items-center justify-center gap-3 flex-wrap",
        years_dropdown: "flex items-center",
        month_grid: "w-full",
        weekdays: "grid grid-cols-7 w-full gap-0",
        weekday:
          "w-9 h-9 flex items-center justify-center text-muted-foreground rounded-md font-normal text-[0.8rem]",
        weeks: "space-y-1",
        week: "grid grid-cols-7 w-full mt-2 gap-0",
        day: "h-9 w-9 p-0 relative flex items-center justify-center text-sm [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day_button: cn(
          buttonVariants({ variant: "ghost" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100"
        ),
        range_end:
          "bg-gradient-to-r from-primary to-[hsl(var(--primary-light))] text-primary-foreground",
        selected:
          "bg-gradient-to-r from-primary to-[hsl(var(--primary-light))] text-primary-foreground hover:bg-gradient-to-r hover:from-primary hover:to-[hsl(var(--primary-light))] hover:text-primary-foreground focus:bg-gradient-to-r focus:from-primary focus:to-[hsl(var(--primary-light))] focus:text-primary-foreground",
        today: "bg-accent text-accent-foreground",
        outside:
          "text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
        disabled: "text-muted-foreground opacity-50",
        range_middle:
          "aria-selected:bg-accent aria-selected:text-accent-foreground",
        hidden: "invisible",
        // v8 backwards-compat keys (some bundles may still use these)
        caption: "flex justify-center pt-1 relative items-center",
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full",
        head_row: "grid grid-cols-7 w-full",
        head_cell:
          "w-9 h-9 flex items-center justify-center text-muted-foreground text-[0.8rem]",
        row: "grid grid-cols-7 w-full mt-2",
        cell: "h-9 w-9 flex items-center justify-center p-0 text-sm",
        day_range_end: "day-range-end",
        day_selected:
          "bg-gradient-to-r from-primary to-[hsl(var(--primary-light))] text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground opacity-50",
        day_range_middle: "aria-selected:bg-accent",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={components}
      {...props}
    />
  )
}
Calendar.displayName = "Calendar"

export { Calendar }
