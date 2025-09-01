"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, MapPin, Users, Plus, Edit, Trash2, Eye } from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { apiCall } from "@/helper/axios";
import EOSidebar from "./core-components/eo-sidebar";

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
}

export default function EventOrganizerPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalSeats: 0,
    totalRevenue: 0,
    activeEvents: 0,
  });
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
    }
  }, [authLoading]);

  const fetchOrganizerEvents = async () => {
    try {
      const response = await apiCall.get("/event/organizer");
      setEvents(response.data.data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchOrganizerStats = async () => {
    try {
      const response = await apiCall.get("/event/organizer/stats");
      setStats({
        totalEvents: events.length,
        totalSeats: events.reduce((sum, event) => sum + event.total_seats, 0),
        totalRevenue: response.data.data?.total_revenue || 0,
        activeEvents: events.filter(
          (event) => new Date(event.event_start_date) > new Date()
        ).length,
      });
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleCreateEvent = () => {
    router.push("/event-organizer/event-management/create");
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  // Show loading while checking auth
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

      <div className="flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 rounded-lg mt-8 mb-8">
            <div className="px-6 py-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-[#09431C]">
                    Event Organizer Dashboard
                  </h1>
                  <p className="text-gray-600 mt-1">
                    Manage your events and track performance
                  </p>
                </div>
                <Button
                  onClick={handleCreateEvent}
                  className="bg-[#09431C] hover:bg-[#09431C]/90 text-white"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create New Event
                </Button>
              </div>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
                  <div className="text-2xl font-bold">{stats.totalEvents}</div>
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
                    {stats.totalSeats.toLocaleString()}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined capacity
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Revenue
                  </CardTitle>
                  <div className="text-[#00481a] font-semibold text-lg">Rp</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(stats.totalRevenue)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    From successful transactions
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Active Events
                  </CardTitle>
                  <div className="text-[#00481a] font-semibold">●</div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.activeEvents}</div>
                  <p className="text-xs text-muted-foreground">
                    Upcoming & ongoing
                  </p>
                </CardContent>
              </Card>
            </div>

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
                    View Transactions
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
                      className="bg-[#09431C] hover:bg-[#09431C]/90 text-white"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create Event
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

                        <CardHeader className="pb-3">
                          <div className="flex items-start justify-between">
                            <CardTitle className="text-lg line-clamp-2 group-hover:text-[#00481a] transition-colors duration-300">
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

                        <CardContent className="space-y-3 flex-grow">
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
                          <div className="flex space-x-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEvent(event.id)}
                              className="flex-1 border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEvent(event.id)}
                              className="flex-1 border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="border-2 border-red-300 hover:border-red-500 hover:bg-red-50 text-red-700 hover:text-red-800 font-medium"
                            >
                              <Trash2 className="w-4 h-4" />
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
