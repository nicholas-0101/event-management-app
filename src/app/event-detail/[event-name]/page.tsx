"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { apiCall } from "@/helper/axios";
import { CalendarDaysIcon, LoaderIcon, MapPin, SearchX } from "lucide-react";
import Link from "next/link";

interface ITicket {
  ticket_type: string;
  ticket_price: number;
  ticket_quota: number;
  available_qty: number;
}

interface IEvent {
  id: number;
  event_name: string;
  event_description: string;
  event_location: string;
  event_thumbnail: string;
  event_start_date: string;
  event_end_date: string;
  tickets: ITicket[];
}

function formatDate(date: string | Date) {
  if (!date) return "";

  if (typeof date !== "string") {
    // format in date
    return new Intl.DateTimeFormat("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date);
  }

  const onlyDate = date.split("T")[0];
  const [year, month, day] = onlyDate.split("-").map(Number);

  // no timezone conversion
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(year, month - 1, day));
}

export default function EventDetailPage() {
  const params = useParams();

  const slugParam = Array.isArray(params["event-name"])
    ? params["event-name"][0]
    : params["event-name"];

  const eventNameParam = slugParam?.replace(/-/g, " ");

  const [event, setEvent] = useState<IEvent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasReviewed, setHasReviewed] = useState(false);

  const handleReviewSubmitted = () => {
    setHasReviewed(true);
  };

  useEffect(() => {
    if (!event) return;
    const reviewed = localStorage.getItem(`reviewed_event_${event.id}`);
    if (reviewed) setHasReviewed(true);
  }, [event]);
  useEffect(() => {
    if (!eventNameParam) return;

    const fetchEvent = async () => {
      try {
        const res = await apiCall.get(
          `/event/detail/${encodeURIComponent(eventNameParam)}`
        );

        const data = res.data.data;

        const tickets = data.tickets.map((t: any) => ({
          ticket_type: t.ticket_type,
          ticket_price: t.ticket_price ?? t.price,
          available_qty: t.available_qty,
        }));

        setEvent({
          id: data.id, // or data.event_id depending on backend response
          ...data,
          tickets,
        });
      } catch (err: any) {
        console.error("Failed to fetch event:", err);
        setError(
          err.response?.status === 404
            ? "Event not found."
            : "Failed to fetch event details."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [eventNameParam]);

  if (loading)
    return (
      <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
        <LoaderIcon color="#525252" size={200} />
        Loading events...
      </p>
    );
  if (error) return <p className="p-6 text-red-500">{error}</p>;
  if (!event)
    return (
      <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
        <SearchX color="#525252" size={200} /> Events Not Found
      </p>
    );

  const now = new Date();
  const isEventEnded = new Date(event.event_end_date) < now;

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Event Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Thumbnail */}
          <div className="relative w-full h-72 rounded-2xl overflow-hidden shadow-md">
            <Image
              src={event.event_thumbnail}
              alt={event.event_name}
              fill
              className="object-cover"
            />
          </div>

          {/* Event Info */}
          <div className="space-y-2">
            <h1 className="text-4xl font-black text-[#09431C]">
              {event.event_name}
            </h1>
            <p className="text-gray-600">{event.event_description}</p>
            <p className="font-medium flex gap-1 text-[#6FB229]">
              <MapPin size={20} color="#6FB229" />
              {event.event_location}
            </p>
            <p className="text-sm text-gray-500 flex gap-1">
              {" "}
              <CalendarDaysIcon size={20} />
              {formatDate(event.event_start_date)} -{" "}
              {formatDate(event.event_end_date)}
            </p>
          </div>
        </div>

        {/* Right: Tickets + Actions */}
        <div className="lg:col-span-1 flex flex-col">
          <div>
            <h2 className="text-3xl font-semibold mb-4 text-[#09431C]">
              🎟 Tickets
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {event.tickets.map((ticket, i) => (
                <Card
                  key={i}
                  className="rounded-xl border border-[#09431C]/40 shadow-sm shadow-[#09431C]/30"
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold capitalize">
                      {ticket.ticket_type}
                    </h3>
                    <p className="text-gray-600">
                      Rp {ticket.ticket_price.toLocaleString("id-ID")}
                    </p>
                    <p className="text-sm text-[#6FB229]">
                      {ticket.available_qty.toLocaleString("id-ID")} tickets
                      remaining
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Button */}
          <div className="mt-6">
            {isEventEnded ? (
              hasReviewed ? (
                <Button
                  disabled
                  className="w-full bg-[#6FB229] cursor-not-allowed rounded-lg"
                >
                  Already Reviewed
                </Button>
              ) : (
                <Link href={`/review/${event.id}`} passHref>
                  <Button className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg cursor-pointer">
                    Rate Event
                  </Button>
                </Link>
              )
            ) : event.tickets.every((t) => t.available_qty === 0) ? (
              <Button
                className="w-full bg-[#6FB229] cursor-not-allowed rounded-lg"
                disabled
              >
                Sold Out
              </Button>
            ) : (
              <Link href={`/transaction/${event.id}`}>
                <Button className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg">
                  Buy Ticket
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
