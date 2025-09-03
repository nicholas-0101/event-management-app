"use client";

import React, { useState, useEffect, useMemo } from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  Customized,
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
import { format, addMonths, addDays, subYears } from "date-fns";
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

const COLORS = [
  "#2563EB", // blue-600
  "#10B981", // emerald-500
  "#F59E0B", // amber-500
  "#EF4444", // red-500
  "#8B5CF6", // violet-500
  "#06B6D4", // cyan-500
  "#F43F5E", // rose-500
  "#22C55E", // green-500
  "#A855F7", // purple-500
  "#EAB308", // yellow-500
  "#3B82F6", // blue-500
  "#0EA5E9", // sky-500
];

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
  const [timeRange, setTimeRange] = useState<"day" | "month" | "year">("month");
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

  // Build labels based on timeRange
  const bucketsList = useMemo(() => {
    const now = new Date();
    const list: { key: string; label: string }[] = [];
    if (timeRange === "day") {
      for (let i = 29; i >= 0; i--) {
        const d = addDays(now, -i);
        const key = format(d, "yyyy-MM-dd");
        const label = format(d, "dd MMM", { locale: id });
        list.push({ key, label });
      }
    } else if (timeRange === "year") {
      const start = subYears(now, 4);
      for (let y = start.getFullYear(); y <= now.getFullYear(); y++) {
        const key = String(y);
        const label = key;
        list.push({ key, label });
      }
    } else {
      for (let i = 11; i >= 0; i--) {
        const d = addMonths(now, -i);
        const key = format(d, "yyyy-MM");
        const label = format(d, "MMM yyyy", { locale: id });
        list.push({ key, label });
      }
    }
    return list;
  }, [timeRange]);

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

  // Aggregate stats from SUCCESS transactions based on selected time range
  const monthlyData = useMemo(() => {
    const buckets = new Map<string, any>();
    bucketsList.forEach(({ key, label }) => {
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
        const dt = new Date(t.transaction_date_time);
        const key =
          timeRange === "day"
            ? format(dt, "yyyy-MM-dd")
            : timeRange === "year"
            ? format(dt, "yyyy")
            : format(dt, "yyyy-MM");
        const rec = buckets.get(key);
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

    return bucketsList.map(({ key }) => buckets.get(key));
  }, [
    transactions,
    bucketsList,
    selectedEventId,
    metric,
    activeEventNames,
    timeRange,
  ]);

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
    const rangeLabel =
      timeRange === "day"
        ? "per Day"
        : timeRange === "year"
        ? "per Year"
        : "per Month";
    if (selectedEventId === "all")
      return `${metricLabel} ${rangeLabel} (Per Event)`;
    const selectedEvent = eventOptions.find(
      (e) => String(e.id) === selectedEventId
    );
    return `${metricLabel} ${rangeLabel} - ${
      selectedEvent?.name || "Selected Event"
    }`;
  }, [metric, selectedEventId, eventOptions, timeRange]);

  // Custom overlay to draw subtle borders per month row (y-band)
  const MonthRowBorders: React.FC<any> = (props) => {
    try {
      const {
        yAxisMap,
        offset,
        chartWidth,
        width: compWidth,
      } = props || ({} as any);
      const yAxis: any = yAxisMap
        ? (Object.values(yAxisMap) as any[])[0]
        : null;
      const scale = yAxis?.scale as any;
      const bandwidth =
        typeof scale?.bandwidth === "function" ? scale.bandwidth() : 0;
      if (!scale || !bandwidth) return null;
      const left = offset?.left ?? 0;
      const right = offset?.right ?? 0;
      const fullWidth = compWidth ?? chartWidth ?? 0;
      const width = fullWidth - left - right;
      return (
        <g>
          {monthlyData.map((d: any, idx: number) => {
            const y = scale(d?.name);
            if (typeof y !== "number") return null;
            const yBottom = y + bandwidth;
            return (
              <g key={idx}>
                {idx === 0 && width > 0 && (
                  <line
                    x1={left}
                    x2={left + width}
                    y1={y}
                    y2={y}
                    stroke="#000000"
                    strokeWidth={2}
                  />
                )}
                {width > 0 && (
                  <line
                    x1={left}
                    x2={left + width}
                    y1={yBottom}
                    y2={yBottom}
                    stroke="#000000"
                    strokeWidth={2}
                  />
                )}
              </g>
            );
          })}
        </g>
      );
    } catch (e) {
      return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="rounded-xl border border-gray-100 bg-white/80 backdrop-blur p-6 shadow-sm">
        <h3 className="flex items-center gap-2 mb-4 text-sm font-semibold tracking-wide text-gray-800">
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

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Date:</span>
            <Select
              value={timeRange}
              onValueChange={(v) => setTimeRange(v as any)}
            >
              <SelectTrigger className="w-full md:w-56">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="day">Day</SelectItem>
                <SelectItem value="month">Monthly</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Chart Section */}
      <div className="rounded-xl border border-gray-100 bg-white/80 backdrop-blur p-6 shadow-sm">
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
            <ResponsiveContainer width="100%" height={540}>
              <BarChart
                data={monthlyData}
                margin={{ top: 16, right: 24, left: 12, bottom: 80 }}
                barCategoryGap={"10%"}
                barGap={0}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  interval={timeRange === "day" ? 2 : 0}
                  angle={-35}
                  textAnchor="end"
                  height={110}
                  tick={{ fontSize: 20 }}
                />
                <YAxis
                  tickLine={false}
                  axisLine={{ stroke: "#E5E7EB" }}
                  tickFormatter={(v) =>
                    metric === "revenue"
                      ? formatCurrency(Number(v))
                      : Number(v).toLocaleString("id-ID")
                  }
                  tick={{ fontSize: 20 }}
                />
                <Tooltip
                  cursor={{ fill: "#F9FAFB" }}
                  formatter={(value: any) =>
                    metric === "revenue"
                      ? formatCurrency(Number(value))
                      : Number(value).toLocaleString("id-ID")
                  }
                />
                <Legend wrapperStyle={{ fontSize: 20 }} />
                {activeEventNames.map((ev, idx) => (
                  <Bar
                    key={ev}
                    dataKey={ev}
                    name={ev}
                    fill={COLORS[idx % COLORS.length]}
                    radius={[6, 6, 0, 0]}
                    maxBarSize={240}
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
