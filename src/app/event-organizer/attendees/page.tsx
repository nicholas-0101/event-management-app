"use client";

import React, { useEffect, useMemo, useState } from "react";
import EOSidebar from "../core-components/eo-sidebar";
import { apiCall } from "@/helper/axios";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Search, Calendar } from "lucide-react";
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
    return "bg-[#ffe9e9] border-[#ffc9c9] text-[#7a0d0d]";
  if (key.includes("regular") || key.includes("reg"))
    return "bg-[#e9ffd1] border-[#c6ee9a] text-[#143e00]";
  if (key.includes("premium") || key.includes("gold"))
    return "bg-[#fff4d6] border-[#ffe7ad] text-[#6a3b00]";
  return "bg-[#eef2ff] border-[#c7d2fe] text-[#1e3a8a]";
};

export default function AttendeesPage() {
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
    <div className="min-h-screen bg-gradient-to-br from-[#f6ffea] to-[#e9ffd1]">
      <EOSidebar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Attendee Management
            </h1>
          </div>
          <Badge
            variant="secondary"
            className="text-[#00481a] bg-[#c6ee9a] border border-[#97d753]"
          >
            <Users className="w-4 h-4 mr-2" /> {totalTicketsAll} Attendee
          </Badge>
        </div>

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="col-span-1 md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <Input
                    placeholder="Cari nama atau email attendee..."
                    className="pl-9"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <div className="relative">
                  <select
                    className="w-full appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#97d753]"
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                  >
                    <option value="all">Semua Event</option>
                    {eventOptions.map((ev) => (
                      <option key={ev.id} value={ev.id}>
                        {ev.name}
                      </option>
                    ))}
                  </select>
                  <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
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
                Belum ada attendee
              </h3>
              <p className="text-gray-600">
                Tidak ditemukan transaksi SUCCESS{" "}
                {selectedEventId !== "all"
                  ? "untuk event terpilih"
                  : "untuk event Anda"}
                .
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="overflow-x-auto">
            <CardContent className="p-0">
              <div className="min-w-full">
                <div className="sticky top-0 z-10 grid grid-cols-12 gap-0 px-4 py-3 bg-[#e9f7cc] text-[#08340a] font-semibold border-b shadow-sm divide-x divide-[#d9eab5]">
                  <div className="col-span-3">User</div>
                  <div className="col-span-4">Email</div>
                  <div className="col-span-2">Event</div>
                  <div className="col-span-2">Jenis Tiket (qty)</div>
                  <div className="col-span-1 text-right">Total</div>
                </div>
                <div>
                  {attendees.map((a, idx) => (
                    <div
                      key={`${a.userId}-${a.eventId}`}
                      className={`grid grid-cols-12 gap-0 px-4 py-3 border-b ${
                        idx % 2 === 0 ? "bg-white" : "bg-white/70"
                      } hover:bg-[#f9ffe9] transition-colors divide-x divide-gray-200`}
                    >
                      <div className="col-span-3 flex items-center gap-3 min-w-0">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[#dff4be] text-[#0f3d00] flex items-center justify-center text-xs font-bold">
                          {getInitials(a.username)}
                        </div>
                        <span className="truncate font-medium text-gray-900">
                          {a.username}
                        </span>
                      </div>
                      <div
                        className="col-span-4 text-gray-700 text-xs whitespace-nowrap"
                        title={a.email}
                      >
                        {a.email}
                      </div>
                      <div className="col-span-2 text-gray-700 text-xs whitespace-normal break-words leading-tight">
                        {a.eventName}
                      </div>
                      <div className="col-span-2 text-gray-700">
                        <div className="flex flex-wrap gap-2">
                          {allTicketTypes.map((type) => (
                            <span
                              key={type}
                              className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs border ${chipColor(
                                type
                              )}`}
                            >
                              <span className="font-semibold mr-1 uppercase tracking-wide">
                                {type}:
                              </span>
                              <span className="tabular-nums">
                                {a.ticketTypes[type] || 0}
                              </span>
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-1 flex items-center justify-end">
                        <span className="inline-flex items-center justify-center min-w-[2.25rem] px-2 py-1 rounded-full bg-[#00481a] text-white text-sm font-bold tabular-nums">
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
    </div>
  );
}
