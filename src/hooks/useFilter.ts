// "use client";

// import { useRouter, useSearchParams } from "next/navigation";
// import { useEffect } from "react";

// export function useSyncFiltersToUrl(
//   search: string,
//   activeCategory: string,
//   dateRange: { from?: Date; to?: Date }
// ) {
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const params = new URLSearchParams(searchParams.toString());

//     if (search) params.set("search", search);
//     else params.delete("search");

//     if (activeCategory && activeCategory !== "All Types")
//       params.set("category", activeCategory);
//     else params.delete("category");

//     if (dateRange?.from) {
//       params.set("from", dateRange.from.toISOString().split("T")[0]);
//       if (dateRange.to) {
//         params.set("to", dateRange.to.toISOString().split("T")[0]);
//       } else {
//         params.delete("to");
//       }
//     } else {
//       params.delete("from");
//       params.delete("to");
//     }

//     router.replace(`?${params.toString()}`);
//   }, [search, activeCategory, dateRange, router, searchParams]);
// }

// export function useFiltersFromUrl(
//   setSearch: (v: string) => void,
//   setActiveCategory: (v: string) => void,
//   setDateRange: (v: DateRange | undefined) => void // allow undefined
// ) {
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     const search = searchParams.get("search") || "";
//     const category = searchParams.get("category") || "All Types";
//     const from = searchParams.get("from");
//     const to = searchParams.get("to");

//     setSearch(search);
//     setActiveCategory(category);

//     if (from) {
//       setDateRange({
//         from: new Date(from),
//         to: to ? new Date(to) : new Date(from),
//       });
//     }
//   }, [searchParams, setSearch, setActiveCategory, setDateRange]);
// }