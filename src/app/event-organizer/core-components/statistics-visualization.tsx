"use client";

import React, { useState, useEffect } from "react";
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
import {
  Calendar,
  TrendingUp,
  Users,
  DollarSign,
  BarChart3,
} from "lucide-react";
import {
  format,
  parseISO,
  startOfYear,
  startOfMonth,
  startOfDay,
  eachYearOfInterval,
  addMonths,
  addDays,
} from "date-fns";
import { id } from "date-fns/locale";

interface Event {
  id: number;
  event_name: string;
  event_description: string;
  event_location: string;
  event_start_date: string;
  event_end_date: string;
  total_seats: number;
  available_seats: number;
  event_category: string;
  event_thumbnail: string;
  created_at: string;
  revenue?: number;
  attendees?: number;
}

interface StatisticsVisualizationProps {
  events: Event[];
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
  const [timeRange, setTimeRange] = useState("year");
  const [chartType, setChartType] = useState("events");
  const [yearData, setYearData] = useState<any[]>([]);
  const [monthData, setMonthData] = useState<any[]>([]);
  const [dayData, setDayData] = useState<any[]>([]);

  useEffect(() => {
    if (events.length > 0) {
      generateYearlyData();
      generateMonthlyData();
      generateDailyData();
    }
  }, [events]);

  const generateYearlyData = () => {
    const yearStats = new Map();

    // Get date range from events
    const dates = events
      .map((e) => new Date(e.event_start_date))
      .sort((a, b) => a.getTime() - b.getTime());
    const startYear = dates[0] ? startOfYear(dates[0]) : new Date();
    const endYear = dates[dates.length - 1]
      ? startOfYear(dates[dates.length - 1])
      : new Date();

    const years = eachYearOfInterval({ start: startYear, end: endYear });

    years.forEach((year) => {
      const yearStr = format(year, "yyyy");
      yearStats.set(yearStr, {
        year: yearStr,
        events: 0,
        revenue: 0,
        attendees: 0,
        seats: 0,
      });
    });

    events.forEach((event) => {
      const eventYear = format(new Date(event.event_start_date), "yyyy");
      const current = yearStats.get(eventYear) || {
        year: eventYear,
        events: 0,
        revenue: 0,
        attendees: 0,
        seats: 0,
      };

      current.events += 1;
      current.revenue += event.revenue || 0;
      current.attendees += event.total_seats - event.available_seats || 0;
      current.seats += event.total_seats;

      yearStats.set(eventYear, current);
    });

    setYearData(Array.from(yearStats.values()));
  };

  const generateMonthlyData = () => {
    const monthStats = new Map();
    const currentDate = new Date();

    // Generate last 12 months
    for (let i = 11; i >= 0; i--) {
      const date = addMonths(currentDate, -i);
      const monthKey = format(date, "yyyy-MM");
      const monthName = format(date, "MMM yyyy", { locale: id });

      monthStats.set(monthKey, {
        month: monthName,
        events: 0,
        revenue: 0,
        attendees: 0,
        seats: 0,
      });
    }

    events.forEach((event) => {
      const eventMonth = format(new Date(event.event_start_date), "yyyy-MM");
      const current = monthStats.get(eventMonth);

      if (current) {
        current.events += 1;
        current.revenue += event.revenue || 0;
        current.attendees += (event.total_seats - event.available_seats) || 0;
        current.seats += event.total_seats;
      }
    });

    setMonthData(Array.from(monthStats.values()));
  };

  const generateDailyData = () => {
    const dayStats = new Map();
    const currentDate = new Date();

    // Generate last 30 days
    for (let i = 29; i >= 0; i--) {
      const date = addDays(currentDate, -i);
      const dayKey = format(date, "yyyy-MM-dd");
      const dayName = format(date, "dd MMM", { locale: id });

      dayStats.set(dayKey, {
        day: dayName,
        events: 0,
        revenue: 0,
        attendees: 0,
        seats: 0,
      });
    }

    events.forEach((event) => {
      const eventDay = format(new Date(event.event_start_date), "yyyy-MM-dd");
      const current = dayStats.get(eventDay);

      if (current) {
        current.events += 1;
        current.revenue += event.revenue || 0;
        current.attendees += (event.total_seats - event.available_seats) || 0;
        current.seats += event.total_seats;
      }
    });

    setDayData(Array.from(dayStats.values()));
  };

  const getCurrentData = () => {
    switch (timeRange) {
      case "year":
        return yearData;
      case "month":
        return monthData;
      case "day":
        return dayData;
      default:
        return yearData;
    }
  };

  const getChartData = () => {
    const data = getCurrentData();
    return data.map((item) => ({
      name: item.year || item.month || item.day,
      events: item.events,
      revenue: item.revenue,
      attendees: item.attendees,
      seats: item.seats,
    }));
  };

  const renderChart = () => {
    const data = getChartData();
    const dataKey =
      chartType === "events"
        ? "events"
        : chartType === "revenue"
        ? "revenue"
        : chartType === "attendees"
        ? "attendees"
        : "seats";

    if (chartType === "pie") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) =>
                `${name} ${((percent || 0) * 100).toFixed(0)}%`
              }
              outerRadius={80}
              fill="#8884d8"
              dataKey={dataKey}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={COLORS[index % COLORS.length]}
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "area") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Area
              type="monotone"
              dataKey={dataKey}
              stroke="#6FB229"
              fill="#97d753"
              fillOpacity={0.6}
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    }

    if (chartType === "line") {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey={dataKey}
              stroke="#6FB229"
              strokeWidth={3}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }

    // Default bar chart
    return (
      <ResponsiveContainer width="100%" height={400}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={dataKey} fill="#6FB229" />
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const getChartTitle = () => {
    const timeLabels: Record<string, string> = {
      year: "Yearly",
      month: "Monthly",
      day: "Daily",
    };

    const metricLabels: Record<string, string> = {
      events: "Events",
      revenue: "Revenue",
      attendees: "Attendees",
      seats: "Seats",
      pie: "Distribution",
      area: "Trends",
      line: "Trends",
    };

    return `${timeLabels[timeRange] || "Yearly"} ${metricLabels[chartType] || "Events"} Statistics`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-[#6FB229]" />
            Statistics Visualization
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Time Range:</span>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="year">Yearly</SelectItem>
                  <SelectItem value="month">Monthly</SelectItem>
                  <SelectItem value="day">Daily</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Chart Type:</span>
              <Select value={chartType} onValueChange={setChartType}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="events">Events</SelectItem>
                  <SelectItem value="revenue">Revenue</SelectItem>
                  <SelectItem value="attendees">Attendees</SelectItem>
                  <SelectItem value="seats">Seats</SelectItem>
                  <SelectItem value="pie">Pie Chart</SelectItem>
                  <SelectItem value="area">Area Chart</SelectItem>
                  <SelectItem value="line">Line Chart</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900">
            {getChartTitle()}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {getCurrentData().length > 0 ? (
            renderChart()
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No data available for the selected time range</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-[#6FB229]" />
              <span className="text-sm font-medium">Total Events</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.totalEvents}</div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-[#6FB229]" />
              <span className="text-sm font-medium">Total Revenue</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(stats.totalRevenue)}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-[#6FB229]" />
              <span className="text-sm font-medium">Total Seats</span>
            </div>
            <div className="text-2xl font-bold mt-2">
              {stats.totalSeats.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[#6FB229]" />
              <span className="text-sm font-medium">Active Events</span>
            </div>
            <div className="text-2xl font-bold mt-2">{stats.activeEvents}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
