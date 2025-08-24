"use client";
import * as React from "react";
import { CalendarDays, ChevronDownIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

export default function DateFilter() {
  const [open, setOpen] = React.useState(false);
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  return (
    <div className="flex flex-col gap-3">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id="date"
            className={`w-48 justify-between font-medium rounded-full cursor-pointer border-1 border-[#00481a] text-[#00481a] transition-colors
              ${
                date
                  ? "bg-[#c6ee9a] hover:bg-[#97d753]"
                  : "bg-[#97d753] hover:bg-[#c6ee9a]"
              }
            `}
          >
            <CalendarDays className="mr-2 h-4 w-4" />
            {date ? date.toLocaleDateString() : "Select date"}
            <ChevronDownIcon className="ml-2 h-4 w-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto overflow-hidden p-0" align="start">
          <Calendar
            mode="single"
            selected={date}
            captionLayout="dropdown"
            onSelect={(date) => {
              setDate(date);
              setOpen(false);
            }}
            disabled={(date) => {
              const today = new Date();
              const yesterday = new Date(today);
              yesterday.setDate(today.getDate() - 1);
              return date < yesterday; // disable date before yesterday
            }}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
