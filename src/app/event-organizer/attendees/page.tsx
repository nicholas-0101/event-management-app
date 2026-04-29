"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";

import { apiCall } from "@/helper/axios";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Users, Search, Calendar, MapPin, Filter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

interface TicketEvent {
  id: number;
  event_name: string;
  event_location: string;
  event_start_date: string;
}

interface TicketInfo {
  ticket: {
    id: number;
    ticket_type: string;
    price: number;
    event: TicketEvent;
  };
  qty: number;
  subtotal_price: number;
}

interface TransactionUser {
  id: number;
  username: string;
  email: string;
}

interface Transaction {
  id: number;
  status: string;
  total_price: number;
  transaction_date_time: string;
  user: TransactionUser;
  tickets: TicketInfo[];
}

interface EventOption {
  id: number;
  name: string;
}

type TicketTypeBreakdown = Record<string, number>; // ticket_type -> qty

interface AttendeeRow {
  userId: number;
  username: string;
  email: string;
  eventId: number;
  eventName: string;
  eventLocation: string;
  ticketTypes: TicketTypeBreakdown;
  totalTickets: number;
}

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
};

const chipColor = (type: string) => {
  const key = type.toLowerCase();
  if (key.includes("vip"))
    return "bg-[#fff4d6] border-[#ffe7ad] text-[#6a3b00]";
  if (key.includes("regular") || key.includes("reg"))
    return "bg-[#e9ffd1] border-[#c6ee9a] text-[#143e00]";
};

function AttendeesContent() {
  const [loading, setLoading] = useState<boolean>(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [search, setSearch] = useState<string>("");
  const [selectedEventId, setSelectedEventId] = useState<string>("all");

  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const fetchSuccessTransactions = async () => {
      setLoading(true);
      try {
        const res = await apiCall.get("/transaction/organizer/status/SUCCESS");
        const txs: Transaction[] = res.data.transactions || res.data.data || [];
        setTransactions(txs);
      } catch (err) {
        console.error("Failed to fetch SUCCESS transactions", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSuccessTransactions();
  }, []);

  // Initialize filter from URL query (?event=ID or "all")
  useEffect(() => {
    const ev = searchParams.get("event");
    if (ev && ev !== selectedEventId) {
      setSelectedEventId(ev);
    }
  }, [searchParams]);

  // Keep URL in sync when filter changes
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!selectedEventId || selectedEventId === "all") {
      params.delete("event");
    } else {
      params.set("event", String(selectedEventId));
    }
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [selectedEventId]);

  const eventOptions: EventOption[] = useMemo(() => {
    const map = new Map<number, string>();
    transactions.forEach((t) => {
      t.tickets.forEach((tt) => {
        if (tt.ticket?.event) {
          map.set(tt.ticket.event.id, tt.ticket.event.event_name);
        }
      });
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [transactions]);

  type AggregateKey = string; // `${userId}-${eventId}`

  const attendees: AttendeeRow[] = useMemo(() => {
    const aggregate = new Map<AggregateKey, AttendeeRow>();

    transactions.forEach((tx) => {
      const user = tx.user;
      tx.tickets.forEach((tt) => {
        const eventId = tt.ticket?.event?.id;
        const eventName = tt.ticket?.event?.event_name || "Unknown Event";
        const eventLocation = tt.ticket?.event?.event_location || "Unknown Location";
        const type = tt.ticket?.ticket_type || "Unknown";
        const qty = tt.qty || 0;
        if (!eventId) return;

        if (selectedEventId !== "all" && String(eventId) !== selectedEventId)
          return;

        const key = `${user.id}-${eventId}`;
        const existing = aggregate.get(key);
        if (existing) {
          existing.ticketTypes[type] = (existing.ticketTypes[type] || 0) + qty;
          existing.totalTickets += qty;
        } else {
          aggregate.set(key, {
            userId: user.id,
            username: user.username,
            email: user.email,
            eventId,
            eventName,
            eventLocation,
            ticketTypes: { [type]: qty },
            totalTickets: qty,
          });
        }
      });
    });

    let list = Array.from(aggregate.values());

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (a) =>
          a.username.toLowerCase().includes(q) ||
          a.email.toLowerCase().includes(q)
      );
    }

    list.sort(
      (a, b) =>
        b.totalTickets - a.totalTickets || a.username.localeCompare(b.username)
    );
    return list;
  }, [transactions, search, selectedEventId]);

  const allTicketTypes = useMemo(() => {
    const set = new Set<string>();
    attendees.forEach((a) => {
      Object.keys(a.ticketTypes).forEach((t) => set.add(t));
    });
    return Array.from(set.values()).sort();
  }, [attendees]);

  const totalTicketsAll = useMemo(() => {
    return attendees.reduce((sum, a) => sum + a.totalTickets, 0);
  }, [attendees]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 rounded-2xl mt-8 mb-8">
        <div className="px-6 py-7">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[#09431C]">
                Attendee Management
              </h1>
              <p className="text-gray-500 text-base mt-1">
                View and manage event attendees
              </p>
            </div>
            <Badge className="text-[#09431C] bg-[#c6ee9a]/50 border border-[#97d753] rounded-full px-4 py-1.5 font-semibold">
              <Users className="w-4 h-4 mr-2" /> {totalTicketsAll} Attendees
            </Badge>
          </div>
        </div>
      </div>

      <Card className="mb-6 rounded-2xl border border-gray-100 shadow-md">
        <CardHeader className="pb-2">
          <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
            <Filter className="w-5 h-5 mr-2 text-[#09431C]" />
            Filter & Search Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-stretch">
            <div className="flex-1">
              <div className="relative h-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search attendee by name or email..."
                  className="pl-10 pr-3 py-2 h-full rounded-full border-gray-200 focus:border-[#09431C] focus:ring-[#09431C]"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <div className="relative h-full">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 z-10 pointer-events-none" />
                <Select
                  value={selectedEventId}
                  onValueChange={setSelectedEventId}
                >
                  <SelectTrigger className="w-full bg-white border border-gray-200 rounded-full pl-10 pr-3 py-2 h-full text-sm focus:ring-[#09431C]">
                    <SelectValue placeholder="All Events" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Events</SelectItem>
                    {eventOptions.map((ev) => (
                      <SelectItem key={ev.id} value={String(ev.id)}>
                        {ev.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mb-4" />
          <p className="text-gray-600 text-lg font-medium">
            Loading attendees...
          </p>
        </div>
      ) : attendees.length === 0 ? (
        <Card>
          <CardContent className="py-16 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No attendees yet
            </h3>
            <p className="text-gray-600">
              No successful transactions found{" "}
              {selectedEventId !== "all"
                ? "for the selected event"
                : "for your events"}
              .
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-x-auto">
          <CardContent className="p-0">
            <div className="min-w-full">
              <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-6 py-4 bg-[#09431C] text-white font-semibold border-b rounded-t-2xl">
                <div className="col-span-4">User</div>
                <div className="col-span-4">Event</div>
                <div className="col-span-3">Ticket Type (qty)</div>
                <div className="col-span-1 text-right">Total</div>
              </div>
              <div>
                {attendees.map((a, idx) => (
                  <div
                    key={`${a.userId}-${a.eventId}`}
                    className={`grid grid-cols-12 gap-4 px-6 py-4 border-b items-center ${
                      idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } hover:bg-[#f9ffe9] transition-colors`}
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#dff4be] text-[#0f3d00] flex items-center justify-center text-sm font-bold">
                        {getInitials(a.username)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-gray-900 truncate">
                          {a.username}
                        </div>
                        <div
                          className="text-xs text-gray-500 truncate"
                          title={a.email}
                        >
                          {a.email}
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 min-w-0">
                      <div
                        className="font-semibold text-gray-900 line-clamp-1"
                        title={a.eventName}
                      >
                        {a.eventName}
                      </div>
                      <div className="text-xs text-gray-500 flex items-center mt-1 truncate">
                        <MapPin className="w-3 h-3 mr-1 flex-shrink-0 text-[#09431C]" />
                        <span className="truncate">{a.eventLocation}</span>
                      </div>
                    </div>
                    <div className="col-span-3 text-gray-700 flex items-center">
                      <div className="flex flex-wrap gap-2">
                        {allTicketTypes.map((type) => {
                          const count = a.ticketTypes[type];
                          if (!count) return null; // Only show ticket types the user actually has
                          return (
                            <span
                              key={type}
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs border shadow-sm ${chipColor(
                                type,
                              )}`}
                            >
                              <span className="font-semibold mr-1.5 uppercase tracking-wide">
                                {type}:
                              </span>
                              <span className="tabular-nums font-bold">
                                {count}
                              </span>
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div className="col-span-1 flex items-center justify-end">
                      <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-1 rounded-full bg-[#00481a] text-white text-sm font-bold tabular-nums shadow-sm">
                        {a.totalTickets}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default function AttendeesPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4" />
            <p className="text-gray-600 text-lg font-medium">
              Loading attendees...
            </p>
          </div>
        </div>
      }
    >
      <AttendeesContent />
    </Suspense>
  );
}
