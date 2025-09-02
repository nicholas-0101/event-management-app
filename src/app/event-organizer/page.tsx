"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  BarChart3,
  Gift,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { apiCall } from "@/helper/axios";
import EOSidebar from "./core-components/eo-sidebar";
import StatisticsVisualization from "./core-components/statistics-visualization";
import {
  generateDemoEvents,
  calculateDemoStats,
} from "./core-components/demo-data-generator";

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

interface Txn {
  id: number;
  status: string;
  total_price: number;
}

export default function EventOrganizerPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [statsLoading, setStatsLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalSeats: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });
  const [transactions, setTransactions] = useState<Txn[]>([]);
  const [showStatistics, setShowStatistics] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = () => {
      try {
        const token = localStorage.getItem("token");
        const userData = localStorage.getItem("user");

        if (!token || !userData) {
          router.replace("/signin");
          return;
        }

        const user = JSON.parse(userData);
        if (user.role !== "ORGANIZER") {
          router.replace("/");
          return;
        }
      } catch (error) {
        console.error("Auth check error:", error);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        router.replace("/signin");
        return;
      } finally {
        setAuthLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  useEffect(() => {
    if (!authLoading) {
      fetchOrganizerEvents();
      fetchOrganizerStats();
      fetchOrganizerTransactions();
    }
  }, [authLoading]);

  useEffect(() => {
    if (!loading && events.length > 0) {
      fetchOrganizerStats();
    }
  }, [loading, events]);

  const fetchOrganizerEvents = async () => {
    try {
      const response = await apiCall.get("/event/organizer");
      let eventsData = response.data.data || [];

      if (eventsData.length === 0) {
        eventsData = generateDemoEvents();
      }

      const eventsWithStats = eventsData.map((event: Event) => ({
        ...event,
        revenue: event.revenue || Math.floor(Math.random() * 5000000) + 1000000,
        attendees: event.attendees || event.total_seats - event.available_seats,
      }));

      setEvents(eventsWithStats);
    } catch (error) {
      console.error("Error fetching events:", error);
      const demoEvents = generateDemoEvents();
      setEvents(demoEvents);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerStats = async () => {
    setStatsLoading(true);
    try {
      const response = await apiCall.get("/event/organizer/stats");
      const statsData = response.data.data || response.data;

      setStats({
        totalEvents: statsData.total_events || events.length,
        totalSeats:
          statsData.total_seats ||
          events.reduce((sum, event) => sum + event.total_seats, 0),
        totalRevenue:
          statsData.total_revenue ||
          events.reduce((sum, event) => sum + (event.revenue || 0), 0),
        activeEvents:
          statsData.active_events ||
          events.filter(
            (event) => new Date(event.event_start_date) > new Date()
          ).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
      setStats({
        totalEvents: events.length,
        totalSeats: events.reduce((sum, event) => sum + event.total_seats, 0),
        totalRevenue: events.reduce(
          (sum, event) => sum + (event.revenue || 0),
          0
        ),
        activeEvents: events.filter(
          (event) => new Date(event.event_start_date) > new Date()
        ).length,
      });
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchOrganizerTransactions = async () => {
    try {
      const res = await apiCall.get("/transaction/organizer");
      setTransactions(res.data.transactions || []);
    } catch (e) {
      console.error("Error fetching organizer transactions", e);
    }
  };

  const totalRevenueSuccess = useMemo(() => {
    return (transactions || [])
      .filter((t: Txn) => t.status === "SUCCESS")
      .reduce((sum, t) => sum + (t.total_price || 0), 0);
  }, [transactions]);

  const revenueText = useMemo(
    () => formatCurrency(totalRevenueSuccess),
    [totalRevenueSuccess]
  );
  const revenueNumericText = useMemo(
    () => revenueText.replace(/^Rp\s?/, ""),
    [revenueText]
  );
  const revenueSizeClass = useMemo(() => {
    const len = revenueNumericText.length;
    if (len <= 8) return "text-3xl";
    if (len <= 10) return "text-2xl";
    if (len <= 13) return "text-xl";
    if (len <= 16) return "text-lg";
    return "text-base";
  }, [revenueNumericText]);

  const handleCreateEvent = () => {
    router.push("/event-organizer/event-creation");
  };

  const handleEditEvent = (eventId: number) => {
    router.push(`/event-organizer/event-management/edit/${eventId}`);
  };

  const handleViewEvent = (eventId: number) => {
    router.push(`/event-organizer/event-management/view/${eventId}`);
  };

  const handleDeleteEvent = async (eventId: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await apiCall.delete(`/event/delete/${eventId}`);
        setEvents(events.filter((event) => event.id !== eventId));
        fetchOrganizerStats();
      } catch (error) {
        console.error("Error deleting event:", error);
      }
    }
  };

  const handleCreateVoucher = (eventId: number) => {
    router.push(`/event-organizer/voucher-creation/${eventId}`);
  };

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start)
      return { status: "Upcoming", color: "bg-[#97d753] text-[#00481a]" };
    if (now >= start && now <= end)
      return { status: "Ongoing", color: "bg-[#c6ee9a] text-[#00481a]" };
    return { status: "Completed", color: "bg-gray-100 text-gray-800" };
  };

  function formatCurrency(amount: number) {
    if (!amount || amount === 0) {
      return "Rp 0";
    }
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\s/g, "");
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#6FB229]"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00481a] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <EOSidebar />
      {/* ...lanjutan code tampilan tetap sama */}
    </div>
  );
}
