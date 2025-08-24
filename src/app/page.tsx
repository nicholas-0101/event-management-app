"use client";
import { useState, useEffect } from "react";
import SearchBar from "./core-components/searchbar";
import HeroBanner from "./core-components/landing-banner";
import CategoryFilter from "./core-components/filter-category";
import DateFilter from "./core-components/filter-date";
import EventCard from "./core-components/event-card";
import { apiCall } from "@/helper/axios";

type Event = {
  id: number;
  event_name: string;
  event_thumbnail: string;
  event_start_date: string;
  event_end_date: string;
  event_category: string;
  event_price: number;
};

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All Types");

  const fetchEvents = async () => {
    try {
      const res = await apiCall.get<{ success: boolean; data: Event[] }>(
        "/event"
      );
      setEvents(res.data.data); 
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  if (loading) return <p className="text-center">Loading events...</p>;

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
        {/* <div className="flex w-full mx-auto items-center justify-between">
          <EventCard
            thumbnail="https://media.stubhubstatic.com/stubhub-v2-catalog/d_vgg-defaultLogo.jpg/q_auto:low,f_auto,c_fill,g_auto,w_1200,h_736,dpr_auto/categories/49735/6398337"
            title="BORNPINK IN JAKARTA"
            dateStart={new Date("2025-11-01")}
            dateEnd={new Date("2025-11-02")}
            category="Concert"
            price={1000000}
            href="/events/bornpink-in-jakarta"
          />
        </div> */}

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 p-4">
          {events.map((event) => (
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
      </div>
    </section>
  );
}
