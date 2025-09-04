"use client";
import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

type SearchBarProps = {
  onSearch: (query: string) => void;
  delay?: number;
  initialValue?: string; 
};

export default function SearchBar({
  onSearch,
  delay = 500,
  initialValue = "",
}: SearchBarProps) {
  const [value, setValue] = useState(initialValue);

  useEffect(() => {
    setValue(initialValue); 
  }, [initialValue]);

  useEffect(() => {
    const handler = setTimeout(() => {
      if (value.length >= 3) {
        onSearch(value);
      } else {
        onSearch("");
      }
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay, onSearch]);

  return (
    <div className="w-full sm:w-[28rem] md:w-[36rem] lg:w-[48rem] h-14 rounded-full shadow-md hover:shadow-lg transition shadow-gray-300/50 border border-gray-200 bg-white px-4 flex gap-2 items-center mx-2 sm:mx-0">
      <Search color="#4E7C05" />
      <Input
        placeholder="Search events, artists, teams, and more"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
      />
    </div>
  );
}
