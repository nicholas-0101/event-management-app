"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import SearchBar from "./core-components/searchbar";
import HeroBanner from "./core-components/landing-banner";
import CategoryFilter from "./core-components/filter-category";
import DateFilter from "./core-components/filter-date";
import EventCard from "./core-components/event-card";
import { apiCall } from "@/helper/axios";
import { ArrowRight, LoaderIcon, SearchX } from "lucide-react";
import { Button } from "@/components/ui/button";
import slugify from "slugify";
import { DateRange } from "react-day-picker";

type Event = {
  id: number;
  event_name: string;
  event_thumbnail: string;
  event_start_date: string;
  event_end_date: string;
  event_category: string;
  event_price: number;
};

export default function LandingPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // filters from query params
  const [activeCategory, setActiveCategory] = useState(
    searchParams.get("category") || "All Types"
  );
  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [dateRange, setDateRange] = useState<DateRange | undefined>({
    from: searchParams.get("startDate")
      ? new Date(searchParams.get("startDate")!)
      : undefined,
    to: searchParams.get("endDate")
      ? new Date(searchParams.get("endDate")!)
      : undefined,
  });

  // filters back to URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());

    if (search) params.set("search", search);
    else params.delete("search");

    if (activeCategory && activeCategory !== "All Types")
      params.set("category", activeCategory);
    else params.delete("category");

    if (dateRange?.from) params.set("startDate", dateRange.from.toISOString());
    else params.delete("startDate");

    if (dateRange?.to) params.set("endDate", dateRange.to.toISOString());
    else params.delete("endDate");

    router.replace(`${pathname}?${params.toString()}`);
  }, [search, activeCategory, dateRange, pathname, router]);

  const fetchEvents = async () => {
    try {
      const res = await apiCall.get<{ success: boolean; data: Event[] }>(
        "/event"
      );

      const now = new Date();

      // filter ended events
      const activeEvents = res.data.data.filter(
        (event) => new Date(event.event_end_date) > now
      );

      setEvents(activeEvents);
    } catch (error) {
      console.error("Failed to fetch events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  // filtering
  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      const matchesCategory =
        activeCategory === "All Types" ||
        event.event_category?.toLowerCase() === activeCategory.toLowerCase();

      const searchLower = search.toLowerCase();
      const matchesSearch =
        event.event_name.toLowerCase().includes(searchLower) ||
        event.event_category.toLowerCase().includes(searchLower);

      let matchesDate = true;
      if (dateRange?.from) {
        const normalize = (d: Date) =>
          new Date(d.getFullYear(), d.getMonth(), d.getDate());

        const start = normalize(new Date(event.event_start_date));
        const endRaw = new Date(event.event_end_date);
        endRaw.setDate(endRaw.getDate() - 1);
        const end = normalize(endRaw);

        const from = normalize(dateRange.from);
        const to = dateRange.to ? normalize(dateRange.to) : from;

        matchesDate = start <= to && end >= from;
      }

      return matchesCategory && matchesSearch && matchesDate;
    });
  }, [events, activeCategory, search, dateRange]);

  const newestEvents = useMemo(() => {
    return [...filteredEvents]
      .sort(
        (a, b) =>
          new Date(b.event_start_date).getTime() -
          new Date(a.event_start_date).getTime()
      )
      .slice(0, 6);
  }, [filteredEvents]);

  if (loading)
    return (
      <section>
        <div className="flex flex-col gap-6">
          {/* Search bar */}
          <div className="flex justify-center">
            <SearchBar onSearch={setSearch} initialValue={search} />
          </div>

          {/* Hero Banner */}
          <div className="flex justify-center">
            <HeroBanner setActiveCategory={setActiveCategory} />
          </div>

          {/* Filters - responsive */}
          <div className="flex w-full mx-auto items-center gap-4 overflow-x-auto lg:justify-between lg:overflow-visible">
            <DateFilter onDateChange={setDateRange} initialRange={dateRange} />
            <CategoryFilter
              activeCategory={activeCategory}
              setActiveCategory={setActiveCategory}
            />
          </div>
        </div>

        {/* Loader */}
        <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
          <LoaderIcon color="#525252" size={200} />
          Loading events...
        </p>
      </section>
    );

  return (
    <section>
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <SearchBar onSearch={setSearch} initialValue={search} />
        </div>

        <div className="flex justify-center">
          <HeroBanner setActiveCategory={setActiveCategory} />
        </div>

        <div className="flex w-full mx-auto items-center gap-4 overflow-x-auto lg:justify-between lg:overflow-visible">
          <DateFilter onDateChange={setDateRange} initialRange={dateRange} />
          <CategoryFilter
            activeCategory={activeCategory}
            setActiveCategory={setActiveCategory}
          />
        </div>

        {newestEvents.length === 0 ? (
          <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
            <SearchX color="#525252" size={200} /> Events Not Found
          </p>
        ) : (
          <>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {newestEvents.map((event) => (
                <EventCard
                  key={event.id}
                  thumbnail={event.event_thumbnail}
                  title={event.event_name}
                  dateStart={event.event_start_date}
                  dateEnd={event.event_end_date}
                  category={event.event_category}
                  price={event.event_price}
                  href={`/event-detail/${slugify(event.event_name, {
                    lower: true,
                  })}`}
                />
              ))}
            </div>

            {filteredEvents.length > 6 && (
              <div className="flex justify-end pt-6">
                <Link href="/explore">
                  <Button variant={"link"} size="lg" className="text-[#6FB229]">
                    See More <ArrowRight />
                  </Button>
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}
