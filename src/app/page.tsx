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
  return (
    <section>
      <div className="flex flex-col gap-6">
        <div className="flex justify-center">
          <SearchBar />
        </div>
        <div className="flex justify-center">
          <HeroBanner />
        </div>
        <div className="flex w-full mx-auto items-center justify-between">
          <DateFilter />
          <CategoryFilter />
        </div>
        <div className="flex w-full mx-auto items-center justify-between">
          <EventCard
            thumbnail="https://picsum.photos/id/238/800/400"
            title="Tech Conference"
            dateStart={new Date("2025-10-12")}
            dateEnd={new Date("2025-10-14")}
            category="Technology"
            description="Join industry leaders to discuss future tech trends."
            price={100000}
            href="/events/tech-conference"
          />
        </div>
      </div>
    </section>
  );
}
