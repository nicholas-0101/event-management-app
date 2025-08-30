"use client";
import { useEffect, useMemo, useState } from "react";
import SearchBar from "../core-components/searchbar";
import DateFilter from "../core-components/filter-date";
import CategoryFilter from "../core-components/filter-category";
import { apiCall } from "@/helper/axios";
import { LoaderIcon, SearchX } from "lucide-react";
import EventCard from "../core-components/event-card";

type Event = {
  id: number;
  event_name: string;
  event_thumbnail: string;
  event_start_date: string;
  event_end_date: string;
  event_category: string;
  event_price: number;
};

export default function ExplorePage() {
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("All Types");
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchEvents = async () => {
    try {
      const res = await apiCall.get<{ success: boolean; data: Event[] }>(
        "/event"
      );
      setEvents(res.data.data);
    } catch (error) {
      console.log("failed to fetch event", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === "All Types" ||
        event.event_category?.toLowerCase() === activeCategory.toLowerCase();

      const searchLower = search.toLowerCase();
      const matchesSearch = event.event_name
        .toLowerCase()
        .includes(searchLower);
      event.event_category.toLowerCase().includes(searchLower);

      return matchesCategory && matchesSearch;
    });
  }, [events, activeCategory, search]);


  if (loading) {
    return (
      <section className="flex flex-col gap-6">
        <div className="flex justify-center items-center">
          <SearchBar onSearch={setSearch} />
        </div>
        <div className="flex justify-between w-full mx-auto">
          <DateFilter />
          <CategoryFilter
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>
        <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
          <LoaderIcon color="#525252" size={200} />
          Loading events...
        </p>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex justify-center items-center">
        <SearchBar onSearch={setSearch} />
      </div>
      <div className="flex justify-between w-full mx-auto">
        <DateFilter />
        <CategoryFilter
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />
      </div>
      <div>
        {filteredEvents.length === 0 ? (
          <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
            <SearchX color="#525252" size={200} /> Events Not Found
          </p>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredEvents.map((event) => (
              <EventCard
                key={event.id}
                thumbnail={event.event_thumbnail}
                title={event.event_name}
                dateStart={new Date(event.event_start_date)}
                dateEnd={new Date(event.event_end_date)}
                category={event.event_category}
                price={event.event_price}
                href={`/events/${event.id}`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
