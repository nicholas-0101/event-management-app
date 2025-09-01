"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  MapPin,
  Users,
  Plus,
  Edit,
  Trash2,
  Eye,
  Search,
  Filter,
  TrendingUp,
  Clock,
  CheckCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import EOSidebar from "../core-components/eo-sidebar";
import { apiCall } from "@/helper/axios";

interface Event {
  id: number;
  event_name: string;
  event_description: string;
  event_location: string;
  event_start_date: string;
  event_end_date: string;
  event_category: string;
  total_seats: number;
  available_seats: number;
  event_thumbnail: string;
  created_at: string;
}

export default function EventManagementPage() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchTerm, categoryFilter, statusFilter]);

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

  const filterEvents = () => {
    let filtered = events;

    if (searchTerm) {
      filtered = filtered.filter(
        (event) =>
          event.event_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          event.event_location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (categoryFilter !== "all") {
      filtered = filtered.filter(
        (event) => event.event_category === categoryFilter
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((event) => {
        const now = new Date();
        const start = new Date(event.event_start_date);
        const end = new Date(event.event_end_date);

        if (statusFilter === "upcoming") return now < start;
        if (statusFilter === "ongoing") return now >= start && now <= end;
        if (statusFilter === "completed") return now > end;
        return true;
      });
    }

    setFilteredEvents(filtered);
  };

  const handleCreateEvent = () =>
    router.push("/event-organizer/event-management/create");
  const handleEditEvent = (id: number) =>
    router.push(`/event-organizer/event-management/edit/${id}`);
  const handleViewEvent = (id: number) =>
    router.push(`/event-organizer/event-management/view/${id}`);

  const handleDeleteEvent = async (id: number) => {
    if (confirm("Are you sure you want to delete this event?")) {
      try {
        await apiCall.delete(`/event/delete/${id}`);
        setEvents(events.filter((e) => e.id !== id));
      } catch (error) {
        console.error("Error deleting event:", error);
        alert("Error deleting event");
      }
    }
  };

  const getEventStatus = (startDate: string, endDate: string) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (now < start)
      return {
        status: "Upcoming",
        color: "bg-[#97d753] text-[#00481a]",
        icon: Clock,
      };
    if (now >= start && now <= end)
      return {
        status: "Live",
        color: "bg-[#c6ee9a] text-[#00481a]",
        icon: CheckCircle,
      };
    return {
      status: "Ended",
      color: "bg-gray-100 text-gray-800",
      icon: CheckCircle,
    };
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      CONCERT: "bg-[#97d753] text-[#00481a]",
      FESTIVAL: "bg-[#c6ee9a] text-[#00481a]",
      SPORT: "bg-[#97d753] text-[#00481a]",
      THEATER: "bg-[#c6ee9a] text-[#00481a]",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
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
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#09431C]">
                    Event Management
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Create, edit, and manage your events with ease
                  </p>
                </div>
                <Button
                  onClick={handleCreateEvent}
                  className="bg-[#09431C] hover:bg-[#09431C]/90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create New Event
                </Button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Total Events
                  </CardTitle>
                  <div className="p-2 bg-[#97d753] rounded-lg">
                    <Calendar className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {events.length}
                  </div>
                  <p className="text-sm text-gray-600">All time events</p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Total Seats
                  </CardTitle>
                  <div className="p-2 bg-[#c6ee9a] rounded-lg">
                    <Users className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {events
                      .reduce((sum, event) => sum + event.total_seats, 0)
                      .toLocaleString()}
                  </div>
                  <p className="text-sm text-gray-600">Combined capacity</p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Active Events
                  </CardTitle>
                  <div className="p-2 bg-[#97d753] rounded-lg">
                    <TrendingUp className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {
                      events.filter(
                        (event) => new Date(event.event_start_date) > new Date()
                      ).length
                    }
                  </div>
                  <p className="text-sm text-gray-600">Upcoming & ongoing</p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Filtered Events
                  </CardTitle>
                  <div className="p-2 bg-[#c6ee9a] rounded-lg">
                    <Filter className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {filteredEvents.length}
                  </div>
                  <p className="text-sm text-gray-600">Current results</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[#00481a]" />
                  Filter & Search Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search events by name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 py-3 border-gray-200 focus:border-[#00481a] focus:ring-[#00481a] text-lg"
                    />
                  </div>

                  <Select
                    value={categoryFilter}
                    onValueChange={setCategoryFilter}
                  >
                    <SelectTrigger className="py-3 border-gray-200 focus:border-[#00481a] focus:ring-[#00481a] text-lg">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="CONCERT">Concert</SelectItem>
                      <SelectItem value="FESTIVAL">Festival</SelectItem>
                      <SelectItem value="SPORT">Sport</SelectItem>
                      <SelectItem value="THEATER">Theater</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="py-3 border-gray-200 focus:border-[#00481a] focus:ring-[#00481a] text-lg">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="upcoming">Upcoming</SelectItem>
                      <SelectItem value="ongoing">Live</SelectItem>
                      <SelectItem value="completed">Ended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Events Section */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Your Events
                </h2>
                <div className="flex space-x-3 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push("/event-organizer/transaction-management")
                    }
                    className="flex-1 sm:flex-none border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium py-2 px-6 transition-all duration-300"
                  >
                    View Transactions
                  </Button>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full mb-6">
                      <Calendar className="h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                      {events.length === 0
                        ? "No events yet"
                        : "No events match your filters"}
                    </h3>
                    <p className="text-gray-600 mb-6 text-center text-lg max-w-md">
                      {events.length === 0
                        ? "Create your first event to get started with your event management journey"
                        : "Try adjusting your search criteria or filters to find more events"}
                    </p>
                    {events.length === 0 && (
                      <Button
                        onClick={handleCreateEvent}
                        className="bg-[#09431C] hover:bg-[#09431C]/90 text-white px-8 py-3 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Your First Event
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredEvents.map((event) => {
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
                              <eventStatus.icon className="w-3 h-3 mr-1" />
                              {eventStatus.status}
                            </Badge>
                          </div>
                          <div className="absolute top-3 left-3">
                            <Badge
                              className={`${getCategoryColor(
                                event.event_category
                              )} shadow-lg`}
                            >
                              {event.event_category}
                            </Badge>
                          </div>
                        </div>

                        <CardHeader className="pb-4">
                          <CardTitle className="text-xl font-bold text-gray-900 line-clamp-2 pr-2 group-hover:text-blue-600 transition-colors duration-300">
                            {event.event_name}
                          </CardTitle>
                          <p className="text-gray-600 line-clamp-2 mt-2 leading-relaxed">
                            {event.event_description}
                          </p>
                        </CardHeader>

                        <CardContent className="space-y-4 flex-grow">
                          <div className="space-y-3">
                            <div className="flex items-center text-gray-700">
                              <Calendar className="w-5 h-5 mr-3 text-blue-600 shrink-0" />
                              <span className="font-medium">
                                {format(
                                  new Date(event.event_start_date),
                                  "PPP",
                                  {
                                    locale: id,
                                  }
                                )}
                              </span>
                            </div>

                            <div className="flex items-center text-gray-700">
                              <MapPin className="w-5 h-5 mr-3 text-red-600 shrink-0" />
                              <span className="font-medium truncate">
                                {event.event_location}
                              </span>
                            </div>

                            <div className="flex items-center text-gray-700">
                              <Users className="w-5 h-5 mr-3 text-green-600 shrink-0" />
                              <span className="font-medium">
                                {event.total_seats - event.available_seats} /{" "}
                                {event.total_seats} seats
                              </span>
                            </div>
                          </div>

                          {/* Occupancy Bar */}
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600 font-medium">
                                Occupancy Rate
                              </span>
                              <span className="text-[#00481a] font-bold">
                                {occupancyRate.toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-[#97d753] to-[#c6ee9a] h-3 rounded-full transition-all duration-500 ease-out"
                                style={{ width: `${occupancyRate}%` }}
                              ></div>
                            </div>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex space-x-3 pt-4 mt-auto">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewEvent(event.id)}
                              className="flex-1 border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium py-2 transition-all duration-300"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditEvent(event.id)}
                              className="flex-1 border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700 font-medium py-2 transition-all duration-300"
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteEvent(event.id)}
                              className="border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 text-gray-700 hover:text-red-700 font-medium py-2 transition-all duration-300"
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
