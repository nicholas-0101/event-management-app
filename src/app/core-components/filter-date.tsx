"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarDays, ChevronDownIcon } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";

interface DateFilterProps {
  onDateChange: (range: DateRange | undefined) => void;
  initialRange?: DateRange;
}

export default function DateFilter({
  onDateChange,
  initialRange,
}: DateFilterProps) {
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState<DateRange | undefined>(initialRange);

  useEffect(() => {
    setDate(initialRange); 
  }, [initialRange]);

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className={`w-auto justify-between font-medium rounded-full cursor-pointer border border-[#00481a] text-[#00481a] transition-colors
              ${
                date?.from && date?.to
                  ? "bg-[#c6ee9a] hover:bg-[#97d753]"
                  : "bg-[#97d753] hover:bg-[#c6ee9a]"
              }
            `}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {date?.from && date?.to
              ? `${format(date.from, "PPP")} - ${format(date.to, "PPP")}`
              : "Select date range"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="range"
            selected={date}
            onSelect={(range) => {
              setDate(range);
              onDateChange(range);
              if (range?.from && range?.to) {
                setOpen(true);
              }
            }}
            numberOfMonths={1}
            disabled={(date) => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              return date < yesterday;
            }}
            className="rounded-md border"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
