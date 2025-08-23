"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export default function CategoryFilter() {
  const [activeCategory, setActiveCategory] = useState("All Types");

  const categories = ["All Types", "Sport", "Concert", "Theater", "Festival"];

  return (
    <section>
      <div className="flex gap-2">
        {categories.map((category) => (
          <Button
            key={category}
            onClick={() => setActiveCategory(category)}
            className={`rounded-full font-medium cursor-pointer border-1 border-[#00481a] text-[#00481a] transition-colors
              ${
                activeCategory === category
                  ? "bg-[#c6ee9a] hover:bg-[#97d753]"
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
