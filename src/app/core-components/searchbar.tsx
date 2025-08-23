import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function SearchBar() {
  return (
    <div className="w-4xl h-15 rounded-full shadow-md hover:shadow-lg transition shadow-gray-300/50 border border-gray-200 bg-white px-4 flex gap-1 items-center">
      <Search color="#4E7C05"/>
      <Input
        placeholder="Search events, artists, teams, and more"
        className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent shadow-none"
      />
    </div>
  );
}
