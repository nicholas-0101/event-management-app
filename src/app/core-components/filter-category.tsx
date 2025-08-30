"use client";

import { Button } from "@/components/ui/button";

interface Props {
  activeCategory: string;
  setActiveCategory: (category: string) => void;
}

export default function CategoryFilter({
  activeCategory,
  setActiveCategory,
}: Props) {
  const categories = ["All Types", "Concert", "Festival", "Sport", "Theater"];

  return (
    <section>
      <div className="flex gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full font-medium cursor-pointer border border-[#00481a] text-[#00481a] transition-colors
              ${
                activeCategory === category
                  ? "bg-[#c6ee9a] hover:bg-[#c6ee9a]"
                  : "bg-[#97d753] hover:bg-[#c6ee9a]"
              }
            `}
          >
            {category}
          </Button>
        ))}
      </div>
    </section>
  );
}
