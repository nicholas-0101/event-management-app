"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Formik, Form, Field, FormikErrors } from "formik";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import EOSidebar from "../../../core-components/eo-sidebar";
import { apiCall } from "@/helper/axios";
import { format } from "date-fns";
import { id as localeId } from "date-fns/locale";

interface EventDetail {
  id: number;
  event_name: string;
  event_description: string;
  event_location: string;
  event_start_date: string;
  event_end_date: string;
  event_category: string;
  total_seats: number;
  available_seats: number;
  event_thumbnail: string | null;
  tickets: Array<{
    id: number;
    ticket_type: string;
    price: number;
    quota: number;
    available_qty: number;
  }>;
}

interface FormValues {
  event_name: string;
  event_description: string;
  event_location: string;
  event_start_date: Date | null;
  event_end_date: Date | null;
  event_category: string;
  event_total_seats: number | string;
  event_thumbnail: File | null;
  tickets: Array<{
    ticket_type: string;
    ticket_price: number | string;
    ticket_quota: number | string;
  }>;
}

const mapToFormValues = (e: EventDetail): FormValues => ({
  event_name: e.event_name,
  event_description: e.event_description || "",
  event_location: e.event_location,
  event_start_date: e.event_start_date ? new Date(e.event_start_date) : null,
  event_end_date: e.event_end_date ? new Date(e.event_end_date) : null,
  event_category: e.event_category?.toLowerCase() || "concert",
  event_total_seats: e.total_seats,
  event_thumbnail: null,
  tickets: [
    {
      ticket_type: "regular",
      ticket_price: e.tickets?.[0]?.price || 0,
      ticket_quota: e.tickets?.[0]?.quota || 0,
    },
    {
      ticket_type: "vip",
      ticket_price: e.tickets?.[1]?.price || 0,
      ticket_quota: e.tickets?.[1]?.quota || 0,
    },
  ],
});

export default function EditEventPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [initial, setInitial] = useState<FormValues | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const id = params?.id;
        if (!id) return;
        // Find event from organizer list
        const res = await apiCall.get("/event/organizer");
        const list: EventDetail[] = res.data.data || [];
        const found = list.find((ev) => String(ev.id) === String(id));
        if (!found) {
          alert("Event not found");
          router.push("/event-organizer/event-management");
          return;
        }
        setInitial(mapToFormValues(found));
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [params]);

  if (loading || !initial) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br">
      <EOSidebar />
      <div className="flex justify-center w-full">
        <section className="w-full max-w-5xl p-6 mt-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#09431C]">
            Edit Event
          </h1>

          <Formik
            initialValues={initial}
            enableReinitialize
            onSubmit={async (values) => {
              try {
                const formData: any = {
                  event_name: values.event_name,
                  event_description: values.event_description,
                  event_start_date: values.event_start_date
                    ? new Date(values.event_start_date).toISOString()
                    : null,
                  event_end_date: values.event_end_date
                    ? new Date(values.event_end_date).toISOString()
                    : null,
                  event_location: values.event_location,
                  event_category: values.event_category.toUpperCase(),
                  total_seats: Number(values.event_total_seats) || 0,
                  tickets: values.tickets.map((t) => ({
                    ticket_type: t.ticket_type.toUpperCase(),
                    price: Number(t.ticket_price) || 0,
                    quota: Number(t.ticket_quota) || 0,
                  })),
                };

                // PATCH update
                await apiCall.patch(`/event/edit/${params.id}`, formData);
                alert("Event updated successfully");
                router.push("/event-organizer/event-management");
              } catch (err) {
                console.error("Update failed", err);
                alert("Update failed");
              }
            }}
          >
            {({ values, setFieldValue }) => (
              <Form className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="flex flex-col gap-6 lg:col-span-2">
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event_name">Event Name</Label>
                    <Field as={Input} id="event_name" name="event_name" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Total Seats</Label>
                    <Field as={Input} name="event_total_seats" type="number" />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label>Category</Label>
                    <Select
                      onValueChange={(value) =>
                        setFieldValue("event_category", value)
                      }
                      value={values.event_category}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="concert">Concert</SelectItem>
                        <SelectItem value="festival">Festival</SelectItem>
                        <SelectItem value="sport">Sport</SelectItem>
                        <SelectItem value="theater">Theater</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event_location">Location</Label>
                    <Field
                      as={Input}
                      id="event_location"
                      name="event_location"
                    />
                  </div>

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event_description">Description</Label>
                    <Field
                      as={Textarea}
                      id="event_description"
                      name="event_description"
                      className="w-full h-32 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Date</Label>
                  <Calendar
                    mode="range"
                    selected={{
                      from: values.event_start_date || undefined,
                      to: values.event_end_date || undefined,
                    }}
                    onSelect={(range) => {
                      if (range) {
                        setFieldValue("event_start_date", range.from || null);
                        setFieldValue(
                          "event_end_date",
                          range.to || range.from || null
                        );
                      }
                    }}
                    numberOfMonths={1}
                    className="rounded-lg border w-full"
                  />

                  <div className="flex justify-center items-center text-sm text-gray-600 mt-2 border border-neutral-200 rounded-lg h-10 px-4">
                    {values.event_start_date && values.event_end_date ? (
                      <span className="font-medium">
                        {format(values.event_start_date, "PPP", {
                          locale: localeId,
                        })}{" "}
                        -{" "}
                        {format(values.event_end_date, "PPP", {
                          locale: localeId,
                        })}
                      </span>
                    ) : (
                      <span className="text-neutral-600">No date selected</span>
                    )}
                  </div>

                  <div className="mt-4 border-t pt-4 flex flex-col gap-2">
                    <Label>Tickets (in IDR)</Label>
                    <div className="border border-neutral-200 rounded-lg">
                      <div className="flex gap-4 m-3 items-center">
                        <span className="w-30 capitalize font-medium">
                          Regular
                        </span>
                        <div>
                          <Field
                            as={Input}
                            name="tickets[0].ticket_price"
                            type="number"
                            placeholder="Price"
                            className="rounded-lg flex-1"
                          />
                        </div>
                        <div>
                          <Field
                            as={Input}
                            name="tickets[0].ticket_quota"
                            type="number"
                            placeholder="Quota"
                            className="rounded-lg flex-1"
                          />
                        </div>
                      </div>
                      <div className="flex gap-4 m-3 items-center">
                        <span className="w-30 capitalize font-medium">VIP</span>
                        <div>
                          <Field
                            as={Input}
                            name="tickets[1].ticket_price"
                            type="number"
                            placeholder="Price"
                            className="rounded-lg flex-1"
                          />
                        </div>
                        <div>
                          <Field
                            as={Input}
                            name="tickets[1].ticket_quota"
                            type="number"
                            placeholder="Quota"
                            className="rounded-lg flex-1"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-3">
                  <Button
                    type="submit"
                    className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
                  >
                    Save Changes
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </section>
      </div>
    </div>
  );
}
