"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Gift,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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

function EventManagementContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    fetchOrganizerEvents();
  }, []);

  // Initialize from query
  useEffect(() => {
    const q = searchParams.get("q");
    const cat = searchParams.get("category");
    const st = searchParams.get("status");
    if (q !== null) setSearchTerm(q);
    if (cat) setCategoryFilter(cat);
    if (st) setStatusFilter(st);
  }, [searchParams]);

  // Sync to URL when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!searchTerm) params.delete("q");
    else params.set("q", searchTerm);
    if (!categoryFilter || categoryFilter === "all") params.delete("category");
    else params.set("category", categoryFilter);
    if (!statusFilter || statusFilter === "all") params.delete("status");
    else params.set("status", statusFilter);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [searchTerm, categoryFilter, statusFilter]);

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
    router.push("/event-organizer/event-creation");
  const handleEditEvent = (id: number) =>
    router.push(`/event-organizer/event-management/edit/${id}`);
  const slugify = (name: string) =>
    name
      .toString()
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/--+/g, "-");
  const handleViewEvent = (name: string) =>
    router.push(`/event-organizer/event-detail/${slugify(name)}`);

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

  const handleCreateVoucher = (eventId: number) => {
    router.push(`/event-organizer/voucher-creation/${eventId}`);
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 rounded-2xl mt-8 mb-8">
            <div className="px-6 py-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#09431C]">
                    Event Management
                  </h1>
                  <p className="text-gray-500 text-base">
                    Create, edit, and manage your events with ease
                  </p>
                </div>
                <Button
                  onClick={handleCreateEvent}
                  className="rounded-full bg-[#09431C] hover:bg-[#09431C]/90 text-white px-8 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
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
              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Total Events
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {events.length}
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <Calendar className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    All time events
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Total Seats
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {events
                          .reduce((sum, event) => sum + event.total_seats, 0)
                          .toLocaleString()}
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <Users className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Combined capacity
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Active Events
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {
                          events.filter(
                            (event) => new Date(event.event_start_date) > new Date()
                          ).length
                        }
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <TrendingUp className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Upcoming & ongoing
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Filtered Events
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {filteredEvents.length}
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <Filter className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Current results
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[#09431C]" />
                  Filter & Search Events
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                  <div className="relative flex-1 w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search events by name or location..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-12 pr-3 py-2 rounded-full border-gray-200 focus:border-[#09431C] focus:ring-[#09431C] text-base"
                    />
                  </div>

                  <div className="w-full md:w-48 flex-shrink-0">
                    <Select
                      value={categoryFilter}
                      onValueChange={setCategoryFilter}
                    >
                      <SelectTrigger className="w-full py-2 rounded-full border-gray-200 focus:border-[#09431C] text-base">
                        <SelectValue placeholder="All Categories" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Categories</SelectItem>
                        <SelectItem value="CONCERT">Concert</SelectItem>
                        <SelectItem value="FESTIVAL">Festival</SelectItem>
                        <SelectItem value="SPORT">Sport</SelectItem>
                        <SelectItem value="THEATER">Theater</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="w-full md:w-48 flex-shrink-0">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger className="w-full py-2 rounded-full border-gray-200 focus:border-[#09431C] text-base">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="upcoming">Upcoming</SelectItem>
                        <SelectItem value="ongoing">Live</SelectItem>
                        <SelectItem value="completed">Ended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
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
                    className="flex-1 sm:flex-none rounded-full border-2 border-[#09431C] hover:bg-[#c6ee9a] text-[#09431C] hover:text-[#09431C] font-medium py-2 px-6 transition-all duration-300"
                  >
                    View Transactions
                  </Button>
                </div>
              </div>

              {filteredEvents.length === 0 ? (
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-md">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="p-4 bg-[#c6ee9a]/30 rounded-full mb-6">
                      <Calendar className="h-16 w-16 text-[#09431C]/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                      {events.length === 0
                        ? "No events yet"
                        : "No events match your filters"}
                    </h3>
                    <p className="text-gray-500 mb-6 text-center text-base max-w-md">
                      {events.length === 0
                        ? "Create your first event to get started with your event management journey"
                        : "Try adjusting your search criteria or filters to find more events"}
                    </p>
                    {events.length === 0 && (
                      <Button
                        onClick={handleCreateEvent}
                        className="rounded-full bg-[#09431C] hover:bg-[#09431C]/90 text-white px-8 py-3 text-base font-semibold shadow-md hover:shadow-lg transition-all duration-300"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Your First Event
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ) : (
                <Card className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-x-auto">
                  <CardContent className="p-0">
                    <div className="min-w-[1000px]">
                      <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-6 py-4 bg-[#09431C] text-white font-semibold border-b rounded-t-2xl">
                        <div className="col-span-4">Event Details</div>
                        <div className="col-span-3">Date & Location</div>
                        <div className="col-span-2">Capacity</div>
                        <div className="col-span-2 text-center">Status</div>
                        <div className="col-span-1 text-right">Actions</div>
                      </div>
                      <div>
                        {filteredEvents.map((event, idx) => {
                          const eventStatus = getEventStatus(
                            event.event_start_date,
                            event.event_end_date
                          );
                          const occupancyRate =
                            ((event.total_seats - event.available_seats) /
                              event.total_seats) *
                            100;

                          return (
                            <div
                              key={event.id}
                              className={`grid grid-cols-12 gap-4 px-6 py-4 border-b items-center ${
                                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                              } hover:bg-[#f9ffe9] transition-colors`}
                            >
                              {/* Event Details */}
                              <div className="col-span-4 flex items-center gap-4 min-w-0">
                                <div className="flex-shrink-0 w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
                                  {event.event_thumbnail ? (
                                    <img
                                      src={event.event_thumbnail}
                                      alt={event.event_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#c6ee9a]/40 to-[#97d753]/20">
                                      <Calendar className="h-6 w-6 text-[#09431C]/40" />
                                    </div>
                                  )}
                                </div>
                                <div className="min-w-0 flex-1">
                                  <div className="font-bold text-gray-900 truncate" title={event.event_name}>
                                    {event.event_name}
                                  </div>
                                  <div className="mt-1 flex items-center gap-2">
                                    <Badge
                                      className={`${getCategoryColor(
                                        event.event_category
                                      )} rounded-md px-2 py-0.5 text-[10px] font-semibold tracking-wider`}
                                    >
                                      {event.event_category}
                                    </Badge>
                                  </div>
                                </div>
                              </div>

                              {/* Date & Location */}
                              <div className="col-span-3 min-w-0 text-sm">
                                <div className="flex items-center text-gray-700 font-medium mb-1 truncate">
                                  <Calendar className="w-4 h-4 mr-2 text-[#09431C] flex-shrink-0" />
                                  <span className="truncate">
                                    {format(new Date(event.event_start_date), "dd MMM yyyy, HH:mm", { locale: id })}
                                  </span>
                                </div>
                                <div className="flex items-center text-gray-500 truncate">
                                  <MapPin className="w-4 h-4 mr-2 text-[#09431C] flex-shrink-0" />
                                  <span className="truncate" title={event.event_location}>{event.event_location}</span>
                                </div>
                              </div>

                              {/* Capacity */}
                              <div className="col-span-2 flex flex-col justify-center pr-4">
                                <div className="flex justify-between text-xs text-gray-600 font-medium mb-1">
                                  <span>{event.total_seats - event.available_seats} / {event.total_seats} seats</span>
                                  <span>{occupancyRate.toFixed(0)}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                  <div
                                    className="bg-gradient-to-r from-[#97d753] to-[#6FB229] h-full rounded-full transition-all duration-300"
                                    style={{ width: `${occupancyRate}%` }}
                                  ></div>
                                </div>
                              </div>

                              {/* Status */}
                              <div className="col-span-2 flex justify-center">
                                <Badge className={`${eventStatus.color} rounded-full shadow-sm text-xs font-semibold px-3 py-1 whitespace-nowrap`}>
                                  <eventStatus.icon className="w-3 h-3 mr-1" />
                                  {eventStatus.status}
                                </Badge>
                              </div>

                              {/* Actions */}
                              <div className="col-span-1 flex justify-end">
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="outline"
                                      size="icon"
                                      className="h-8 w-8 rounded-full border-2 border-gray-200 hover:border-[#09431C] text-gray-600 hover:text-[#09431C] transition-colors"
                                    >
                                      <MoreHorizontal className="w-4 h-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end" className="rounded-xl w-40">
                                    <DropdownMenuItem onClick={() => handleViewEvent(event.event_name)} className="cursor-pointer">
                                      <Eye className="w-4 h-4 mr-2" /> View
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleEditEvent(event.id)} className="cursor-pointer">
                                      <Edit className="w-4 h-4 mr-2" /> Edit
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleCreateVoucher(event.id)} className="cursor-pointer">
                                      <Gift className="w-4 h-4 mr-2" /> Voucher
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem variant="destructive" onClick={() => handleDeleteEvent(event.id)} className="cursor-pointer text-red-600 focus:text-red-700 focus:bg-red-50">
                                      <Trash2 className="w-4 h-4 mr-2" /> Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
    </div>
  );
}

export default function EventManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">
              Loading events...
            </p>
          </div>
        </div>
      }
    >
      <EventManagementContent />
    </Suspense>
  );
}
