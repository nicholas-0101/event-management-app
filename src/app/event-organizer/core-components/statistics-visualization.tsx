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
import { formatCurrency } from "@/lib/utils";

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

// Transform raw SQL data to expected structure - SAME AS TRANSACTION MANAGEMENT
const transformTransactionData = (rawData: any[]): OrganizerTransaction[] => {
  if (!Array.isArray(rawData)) return [];

  // Group by transaction ID to handle multiple tickets per transaction
  const transactionMap = new Map<number, any>();

  rawData.forEach((row: any) => {
    const transactionId = row.id;

    if (!transactionMap.has(transactionId)) {
      // Create base transaction structure
      transactionMap.set(transactionId, {
        id: row.id,
        status: row.status,
        total_price: row.total_price,
        transaction_date_time: row.transaction_date_time,
        tickets: [],
      });
    }

    // Add ticket to existing transaction
    const transaction = transactionMap.get(transactionId);
    transaction.tickets.push({
      qty: row.qty,
      subtotal_price: row.subtotal_price,
      ticket: {
        ticket_type: row.ticket_type,
        price: row.price,
        event: {
          id: row.event_id || 0, // Use event_id from raw data
          event_name: row.event_name,
          event_start_date: row.event_start_date,
        },
      },
    });
  });

  return Array.from(transactionMap.values());
};

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
        const response = await apiCall.get("/transaction/organizer/simple");

        // Transform raw SQL data to expected structure
        const transformedTransactions = transformTransactionData(
          response.data.transactions || response.data
        );

        setTransactions(transformedTransactions);

        // Build event options from tickets - use event NAME as unique key
        const eventMap = new Map<string, { id: number; name: string }>();
        transformedTransactions.forEach((t) =>
          t.tickets.forEach((tt) => {
            const id = tt.ticket?.event?.id;
            const name = tt.ticket?.event?.event_name;
            if (name) {
              // Some datasets have id = 0 for all events; use name to ensure uniqueness
              eventMap.set(name, { id: id ?? 0, name });
            }
          })
        );

        const eventOptions = Array.from(eventMap.values());
        setEventOptions(eventOptions);
      } catch (error) {
        console.error("Failed to fetch organizer transactions:", error);
        setTransactions([]);
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
        (e) => String(e.id) === selectedEventId || e.name === selectedEventId
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

  // Aggregate monthly stats from SUCCESS transactions - SAME LOGIC AS TRANSACTION MANAGEMENT
  const monthlyData = useMemo(() => {
    const buckets = new Map<string, any>();
    last12Months.forEach(({ key, label }) => {
      const base: any = { monthKey: key, name: label };
      activeEventNames.forEach((ev) => (base[ev] = 0));
      buckets.set(key, base);
    });

    const isAll = selectedEventId === "all";
    const successTransactions = transactions.filter(
      (t) => t.status === "SUCCESS"
    );

    successTransactions.forEach((t) => {
      try {
        const monthKey = format(new Date(t.transaction_date_time), "yyyy-MM");
        const rec = buckets.get(monthKey);
        if (!rec) {
          return;
        }

        t.tickets.forEach((tt) => {
          const evId = tt.ticket?.event?.id;
          const evName = tt.ticket?.event?.event_name;

          if (evId === null || evId === undefined || !evName) {
            return;
          }

          // Filter by selected event (support id or name)
          if (
            !isAll &&
            !(String(evId) === selectedEventId || evName === selectedEventId)
          ) {
            return;
          }

          const amount =
            metric === "revenue" ? tt.subtotal_price || 0 : tt.qty || 0;

          if (rec[evName] === undefined) rec[evName] = 0;
          rec[evName] += amount;
        });
      } catch (error) {
        console.error("Error processing transaction:", t, error);
      }
    });

    return last12Months.map(({ key }) => buckets.get(key));
  }, [transactions, last12Months, selectedEventId, metric, activeEventNames]);

  // Calculate total revenue from SUCCESS transactions - SAME AS TRANSACTION MANAGEMENT
  const totalRevenueSuccess = useMemo(() => {
    return transactions
      .filter((t) => t.status === "SUCCESS")
      .reduce((sum, t) => sum + (t.total_price || 0), 0);
  }, [transactions]);

  // Calculate total attendees from SUCCESS transactions
  const totalAttendeesSuccess = useMemo(() => {
    return transactions
      .filter((t) => t.status === "SUCCESS")
      .reduce((sum, t) => {
        return (
          sum +
          t.tickets.reduce((ticketSum, tt) => ticketSum + (tt.qty || 0), 0)
        );
      }, 0);
  }, [transactions]);

  const chartTitle = useMemo(() => {
    const metricLabel =
      metric === "revenue" ? "Total Revenue" : "Total Attendees";
    if (selectedEventId === "all")
      return `${metricLabel} per Month (Per Event)`;
    const selectedEvent = eventOptions.find(
      (e) => String(e.id) === selectedEventId
    );
    return `${metricLabel} per Month - ${
      selectedEvent?.name || "Selected Event"
    }`;
  }, [metric, selectedEventId, eventOptions]);

  return (
    <div className="space-y-6">
      {/* Statistics Controls - Simplified without card */}
      <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl p-6 rounded-lg">
        <h3 className="flex items-center gap-2 mb-4">
          <BarChart3 className="h-5 w-5 text-[#6FB229]" />
          Statistics Visualization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Event:</span>
            <Select value={selectedEventId} onValueChange={setSelectedEventId}>
              <SelectTrigger className="w-full md:w-56">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {eventOptions.map((ev) => (
                  <SelectItem key={ev.name} value={ev.name}>
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
      </div>

      {/* Chart Section - Simplified without card */}
      <div className="bg-white/70 backdrop-blur-sm border-0 shadow-xl p-6 rounded-lg">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          {chartTitle}
        </h3>
        {(() => {
          if (loading) {
            return (
              <div className="flex items-center justify-center h-64 text-gray-500">
                Loading chart...
              </div>
            );
          }

          if (transactions.length === 0) {
            return (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <BarChart3 className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    No transaction data available
                  </p>
                  <p className="text-sm text-gray-400">
                    Create events and process transactions to see statistics
                  </p>
                </div>
              </div>
            );
          }

          if (monthlyData.length === 0 || activeEventNames.length === 0) {
            return (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <div className="text-center">
                  <TrendingUp className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-lg font-medium mb-2">
                    No chart data available
                  </p>
                  <p className="text-sm text-gray-400">
                    {transactions.length > 0
                      ? `Found ${transactions.length} transactions but no SUCCESS status or event data`
                      : "No transactions found"}
                  </p>
                </div>
              </div>
            );
          }

          return (
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
          );
        })()}
      </div>
    </div>
  );
}
