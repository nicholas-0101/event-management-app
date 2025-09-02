"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  AreaChart,
  Area,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { BarChart3, TrendingUp, Users, DollarSign } from "lucide-react";
import { format, addMonths } from "date-fns";
import { id } from "date-fns/locale";
import { apiCall } from "@/helper/axios";

interface Event {
  id: number;
  event_name: string;
}

interface TicketLine {
  qty: number;
  subtotal_price: number;
  ticket: {
    ticket_type: string;
    price: number;
    event: {
      id: number;
      event_name: string;
      event_start_date?: string;
    };
  };
}

interface OrganizerTransaction {
  id: number;
  status: string;
  total_price: number;
  transaction_date_time: string;
  tickets: TicketLine[];
}

interface StatisticsVisualizationProps {
  events: any[]; // kept for compatibility (unused for aggregation now)
  stats: {
    totalEvents: number;
    totalSeats: number;
    totalRevenue: number;
    activeEvents: number;
  };
}

const COLORS = ["#6FB229", "#97d753", "#c6ee9a", "#00481a", "#09431C"];

export default function StatisticsVisualization({
  events,
  stats,
}: StatisticsVisualizationProps) {
  const [timeRange, setTimeRange] = useState("month"); // default monthly
  const [metric, setMetric] = useState<"attendees" | "revenue">("attendees");
  const [transactions, setTransactions] = useState<OrganizerTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState<string>("all");
  const [eventOptions, setEventOptions] = useState<
    { id: number; name: string }[]
  >([]);

  useEffect(() => {
    const fetchTx = async () => {
      try {
        const res = await apiCall.get("/transaction/organizer");
        const txs: OrganizerTransaction[] = res.data.transactions || [];
        setTransactions(txs);
        // Build event options from tickets
        const map = new Map<number, string>();
        txs.forEach((t) =>
          t.tickets.forEach((tt) => {
            if (tt.ticket?.event)
              map.set(tt.ticket.event.id, tt.ticket.event.event_name);
          })
        );
        setEventOptions(
          Array.from(map.entries()).map(([id, name]) => ({ id, name }))
        );
      } catch (e) {
        console.error("Failed to fetch organizer transactions", e);
      } finally {
        setLoading(false);
      }
    };
    fetchTx();
  }, []);

  // Build last 12 months labels
  const last12Months = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = addMonths(now, -i);
      const key = format(d, "yyyy-MM");
      const label = format(d, "MMM yyyy", { locale: id });
      list.push({ key, label });
    }
    return list;
  }, []);

  // Determine active event names for series when viewing All Events
  const activeEventNames = useMemo(() => {
    if (selectedEventId !== "all") {
      const ev = eventOptions.find(
        (e) => String(e.id) === selectedEventId
      )?.name;
      return ev ? [ev] : [];
    }
    const set = new Set<string>();
    transactions.forEach((t) =>
      t.tickets.forEach((tt) => {
        const name = tt.ticket?.event?.event_name;
        if (name) set.add(name);
      })
    );
    return Array.from(set.values());
  }, [transactions, selectedEventId, eventOptions]);

  // Aggregate monthly stats from SUCCESS transactions
  const monthlyData = useMemo(() => {
    const buckets = new Map<string, any>();
    last12Months.forEach(({ key, label }) => {
      const base: any = { monthKey: key, name: label };
      activeEventNames.forEach((ev) => (base[ev] = 0));
      buckets.set(key, base);
    });

    const isAll = selectedEventId === "all";

    transactions
      .filter((t) => t.status === "SUCCESS")
      .forEach((t) => {
        const monthKey = format(new Date(t.transaction_date_time), "yyyy-MM");
        const rec = buckets.get(monthKey);
        if (!rec) return;
        t.tickets.forEach((tt) => {
          const evId = tt.ticket?.event?.id;
          const evName = tt.ticket?.event?.event_name;
          if (!evId || !evName) return;
          if (!isAll && String(evId) !== selectedEventId) return;
          const amount =
            metric === "revenue" ? tt.subtotal_price || 0 : tt.qty || 0;
          if (rec[evName] === undefined) rec[evName] = 0; // in case event had no previous bucket init
          rec[evName] += amount;
        });
      });

    return last12Months.map(({ key }) => buckets.get(key));
  }, [transactions, last12Months, selectedEventId, metric, activeEventNames]);

  const chartTitle = useMemo(() => {
    const metricLabel =
      metric === "revenue" ? "Total Revenue" : "Total Attendees";
    if (selectedEventId === "all")
      return `${metricLabel} per Month (Per Event)`;
    const ev =
      eventOptions.find((e) => String(e.id) === selectedEventId)?.name ||
      "Selected Event";
    return `${metricLabel} per Month - ${ev}`;
  }, [metric, selectedEventId, eventOptions]);

  return (
    <div className="space-y-6">
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#6FB229]" />
            Statistics Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Event:</span>
              <Select
                value={selectedEventId}
                onValueChange={setSelectedEventId}
              >
                <SelectTrigger className="w-full md:w-56">
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

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Metric:</span>
              <Select value={metric} onValueChange={(v) => setMetric(v as any)}>
                <SelectTrigger className="w-full md:w-56">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="attendees">Total Attended</SelectItem>
                  <SelectItem value="revenue">Total Revenue</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="text-sm text-gray-600">
              {selectedEventId === "all" && metric === "attendees"
                ? "Default: menampilkan event dengan attended terbanyak tiap bulan"
                : "Menampilkan agregasi per bulan sesuai filter"}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {chartTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-64 text-gray-500">
              Loading chart...
            </div>
          ) : selectedEventId === "all" ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {activeEventNames.map((ev, idx) => (
                  <Bar
                    key={ev}
                    dataKey={ev}
                    name={ev}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                {activeEventNames.map((ev, idx) => (
                  <Bar
                    key={ev}
                    dataKey={ev}
                    name={ev}
                    fill={COLORS[idx % COLORS.length]}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
