"use client";
import { useState } from "react";
import SearchBar from "./core-components/searchbar";
import HeroBanner from "./core-components/landing-banner";
import CategoryFilter from "./core-components/filter-category";
import DateFilter from "./core-components/filter-date";
import EventCard from "./core-components/event-card";

const events = [
  { id: 1, title: "Rock Concert", date: new Date("2025-09-10") },
  { id: 2, title: "Football Match", date: new Date("2025-09-12") },
  { id: 3, title: "Theater Show", date: new Date("2025-09-15") },
];

export default function Home() {
  const [activeCategory, setActiveCategory] = useState("All Types");

  return (
    <section>
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <SearchBar />
        </div>
        <div className="flex justify-center">
          <HeroBanner setActiveCategory={setActiveCategory} />
        </div>
        <div className="flex w-full mx-auto items-center justify-between">
          <DateFilter />
          <CategoryFilter
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>
        <div className="flex w-full mx-auto items-center justify-between">
          <EventCard
            thumbnail="https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/q_auto:low,f_auto,c_fill,g_auto,w_1200,h_736,dpr_auto/categories/49735/6398337"
            title="BORNPINK IN JAKARTA"
            dateStart={new Date("2025-11-01")}
            dateEnd={new Date("2025-11-02")}
            category="Concert"
            price={1000000}
            href="/events/bornpink-in-jakarta"
          />
        </div>
      </div>
    </section>
  );
}
