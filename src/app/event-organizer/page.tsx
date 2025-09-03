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
  CreditCard,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { apiCall } from "@/helper/axios";
import EOSidebar from "./core-components/eo-sidebar";
import StatisticsVisualization from "./core-components/statistics-visualization";

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

interface Transaction {
  id: number;
  user_id: number;
  status: string;
  total_price: number;
  payment_proof_url: string;
  transaction_date_time: string;
  is_accepted: boolean;
  user: {
    id: number;
    username: string;
    email: string;
  };
  tickets: Array<{
    qty: number;
    subtotal_price: number;
    ticket: {
      ticket_type: string;
      price: number;
      event: {
        event_name: string;
        event_location: string;
      };
    };
  }>;
}

// Transform raw SQL data to expected structure
const transformTransactionData = (rawData: any[]): Transaction[] => {
  if (!Array.isArray(rawData)) return [];

  // Group by transaction ID to handle multiple tickets per transaction
  const transactionMap = new Map<number, any>();

  rawData.forEach((row: any) => {
    const transactionId = row.id;

    if (!transactionMap.has(transactionId)) {
      // Create base transaction structure
      transactionMap.set(transactionId, {
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        total_price: row.total_price,
        payment_proof_url: row.payment_proof_url,
        transaction_date_time: row.transaction_date_time,
        is_accepted: row.is_accepted,
        user: {
          id: row.user_id,
          username: row.username,
          email: row.email,
        },
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
          event_name: row.event_name,
          event_location: row.event_location,
        },
      },
    });
  });

  return Array.from(transactionMap.values());
};

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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
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

      // Normalize fields needed by UI
      const eventsWithStats = eventsData.map((event: Event) => ({
        ...event,
        revenue: event.revenue || 0,
        attendees: event.attendees ?? event.total_seats - event.available_seats,
      }));

      setEvents(eventsWithStats);
    } catch (error) {
      console.error("Error fetching events:", error);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerStats = async () => {
    setStatsLoading(true);
    try {
      const response = await apiCall.get("/event/organizer/stats");
      const statsData = response.data.data || response.data;

      // Update stats with backend data
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
      // Fallback to calculated stats from events if API fails
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
      const response = await apiCall.get("/transaction/organizer/simple");

      // Transform raw SQL data to expected structure
      const transformedTransactions = transformTransactionData(
        response.data.transactions || response.data
      );

      setTransactions(transformedTransactions);
    } catch (error) {
      console.error("Error fetching organizer transactions:", error);
      setTransactions([]);
    }
  };

  const totalRevenueSuccess = useMemo(() => {
    return (transactions || [])
      .filter((t: Transaction) => t.status === "SUCCESS")
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
    if (len <= 8) return "text-3xl"; // e.g., 12.345.678
    if (len <= 10) return "text-2xl"; // e.g., 123.456.789
    if (len <= 13) return "text-xl"; // e.g., 1.234.567.890
    if (len <= 16) return "text-lg"; // e.g., 12.345.678.901
    return "text-base";
  }, [revenueNumericText]);

  const handleCreateEvent = () => {
    router.push("/event-organizer/event-creation");
  };

  const handleEditEvent = (eventId: number) => {
    router.push(`/event-organizer/event-management/edit/${eventId}`);
  };

  const slugify = (name: string) =>
    name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-");
  const handleViewEvent = (eventName: string) => {
    router.push(`/event-organizer/event-detail/${slugify(eventName)}`);
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

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#09431C]"></div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <EOSidebar />

      <div className="flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 rounded-lg mt-8 mb-8">
            <div className="px-6 py-8">
              <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
                <div className="w-full sm:w-auto text-center sm:text-left">
                  <h1 className="text-3xl font-bold text-[#09431C]">
                    Event Organizer Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your events and track performance
                  </p>
                </div>
                <div className="flex gap-3 flex-wrap w-full sm:w-auto justify-center sm:justify-end">
                  <Button
                    variant="outline"
                    onClick={() => setShowStatistics(!showStatistics)}
                    className="border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium w-full sm:w-auto"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {showStatistics ? "Hide Statistics" : "View Statistics"}
                  </Button>
                  <Button
                    onClick={handleCreateEvent}
                    className="bg-[#09431C] hover:bg-[#09431C]/90 text-white w-full sm:w-auto"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Create New Event
                  </Button>
                  <Button
                    variant="outline"
                    onClick={fetchOrganizerStats}
                    disabled={statsLoading}
                    className="border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium w-full sm:w-auto"
                  >
                    <BarChart3 className="w-4 h-4 mr-2" />
                    {statsLoading ? "Refreshing..." : "Refresh Stats"}
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Events
                  </CardTitle>
                  <div className="p-2 bg-[#97d753] rounded-lg">
                    <Calendar className="h-4 w-4 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalEvents
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    All time events
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Seats
                  </CardTitle>
                  <div className="p-2 bg-[#c6ee9a] rounded-lg">
                    <Users className="h-4 w-4 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.totalSeats.toLocaleString()
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined capacity
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium leading-tight">
                    Total Revenue
                  </CardTitle>
                  <div className="text-[#00481a] font-semibold text-lg">Rp</div>
                </CardHeader>
                <CardContent>
                  <div
                    className={`font-bold ${revenueSizeClass} whitespace-nowrap leading-tight`}
                  >
                    {statsLoading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      revenueNumericText
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">
                    From successful transactions
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Statistics Visualization */}
            {showStatistics && (
              <div id="statistics-section" className="mb-8">
                <StatisticsVisualization events={events} stats={stats} />
              </div>
            )}

            {/* Events Grid */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-semibold text-gray-900">
                  Your Events
                </h2>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push("/event-organizer/transaction-management")
                    }
                    className="border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium"
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    View Transactions
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push("/event-organizer/pending-approval")
                    }
                    className="border-2 border-yellow-300 hover:border-yellow-500 hover:bg-yellow-50 text-yellow-700 hover:text-yellow-800 font-medium"
                  >
                    <Users className="w-4 h-4 mr-2" />
                    Pending Approval
                  </Button>
                </div>
              </div>

              {events.length === 0 ? (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="flex flex-col items-center justify-center py-12">
                    <div className="p-4 bg-gray-100 rounded-full mb-4">
                      <Calendar className="h-12 w-12 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No events yet
                    </h3>
                    <p className="text-gray-500 mb-4">
                      Create your first event to get started
                    </p>
                    <Button
                      onClick={handleCreateEvent}
                      className="bg-[#09431C] hover:bg-[#09431C]/90 text-white w-full sm:w-auto"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {events.map((event) => {
                    const eventStatus = getEventStatus(
                      event.event_start_date,
                      event.event_end_date
                    );
                    const occupancyRate =
                      ((event.total_seats - event.available_seats) /
                        event.total_seats) *
                      100;

                    return (
                      <Card
                        key={event.id}
                        className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105 h-full flex flex-col group"
                      >
                        <div className="aspect-video bg-gradient-to-br from-gray-200 to-gray-300 rounded-t-lg flex items-center justify-center overflow-hidden relative">
                          {event.event_thumbnail ? (
                            <img
                              src={event.event_thumbnail}
                              alt={event.event_name}
                              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                            />
                          ) : (
                            <div className="text-center">
                              <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-2" />
                              <p className="text-gray-500 text-sm">No Image</p>
                            </div>
                          )}
                          <div className="absolute top-3 right-3">
                            <Badge className={`${eventStatus.color} shadow-lg`}>
                              {eventStatus.status}
                            </Badge>
                          </div>
                        </div>

                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-base sm:text-lg line-clamp-2 group-hover:text-[#00481a] transition-colors duration-300">
                              {event.event_name}
                            </CardTitle>
                            <Badge className={eventStatus.color}>
                              {eventStatus.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 line-clamp-2">
                            {event.event_description}
                          </p>
                        </CardHeader>

                        <CardContent className="space-y-2 flex-grow flex flex-col">
                          <div className="flex items-center text-sm text-gray-600">
                            <Calendar className="w-4 h-4 mr-2 text-[#00481a]" />
                            {format(new Date(event.event_start_date), "PPP", {
                              locale: id,
                            })}
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <MapPin className="w-4 h-4 mr-2 text-[#00481a]" />
                            {event.event_location}
                          </div>

                          <div className="flex items-center text-sm text-gray-600">
                            <Users className="w-4 h-4 mr-2 text-[#00481a]" />
                            {event.total_seats - event.available_seats} /{" "}
                            {event.total_seats} seats
                          </div>

                          {/* Occupancy Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-[#97d753] to-[#c6ee9a] h-2 rounded-full transition-all duration-300"
                              style={{ width: `${occupancyRate}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-gray-500 text-center">
                            {occupancyRate.toFixed(1)}% occupied
                          </p>

                          {/* Action Buttons */}
                          <div className="grid grid-cols-4 gap-1 pt-2 mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEvent(event.event_name)}
                              className="border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium py-2 px-2 text-xs"
                            >
                              <Eye className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEvent(event.id)}
                              className="border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium py-2 px-2 text-xs"
                            >
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCreateVoucher(event.id)}
                              className="border-2 border-purple-300 hover:border-purple-500 hover:bg-purple-50 text-purple-700 hover:text-purple-800 font-medium py-2 px-2 text-xs"
                            >
                              <Gift className="w-3 h-3" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-700 hover:text-red-800 font-medium py-2 px-2 text-xs"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
