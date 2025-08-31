"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DateRange } from "react-day-picker";
import { Formik, Form, Field, FormikErrors, FieldArray } from "formik";
import {
  IEventCreate,
  ITicket,
  eventCreationSchema,
  initialValues,
} from "./EventCreationSchema";
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
import { apiCall } from "@/helper/axios";
import EOSidebar from "../core-components/eo-sidebar";

export default function EventCreationPage() {
  const [date, setDate] = useState<DateRange | undefined>();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <EOSidebar />

      <div className="flex justify-center w-full">
        <section className="w-full max-w-5xl p-6 mt-8">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#09431C]">
            Create New Event
          </h1>

          <Formik
            initialValues={initialValues}
            validationSchema={eventCreationSchema}
            onSubmit={async (values, { resetForm }) => {
              try {
                const formData = new FormData();

                // text fields
                formData.append("event_name", values.event_name);
                formData.append("event_description", values.event_description);
                formData.append(
                  "event_start_date",
                  values.event_start_date
                    ? new Date(values.event_start_date).toISOString()
                    : ""
                );
                formData.append(
                  "event_end_date",
                  values.event_end_date
                    ? new Date(values.event_end_date).toISOString()
                    : ""
                );
                formData.append("event_location", values.event_location);
                formData.append(
                  "event_category",
                  values.event_category.toUpperCase()
                );

                // tickets → stringify & cast numbers
                const tickets = values.tickets.map((ticket) => ({
                  ticket_type: ticket.ticket_type.toUpperCase(),
                  price: Number(ticket.ticket_price) || 0,
                  quota: Number(ticket.ticket_quota) || 0,
                  available_qty:
                    ticket.ticket_quota !== undefined
                      ? Number(ticket.ticket_quota)
                      : Number(ticket.ticket_quota) || 0,
                }));
                formData.append("tickets", JSON.stringify(tickets));

                // file
                if (values.event_thumbnail) {
                  formData.append("event_thumbnail", values.event_thumbnail);
                }

                // send to API
                await apiCall.post("/event/create", formData, {
                  headers: {
                    "Content-Type": "multipart/form-data",
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                });

                resetForm();
                alert("Event created successfully!");
              } catch (error) {
                console.error("Event creation failed", error);
              }
            }}
          >
            {({ errors, touched, values, setFieldValue }) => (
              <Form className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="flex flex-col gap-6 lg:col-span-2">
                  {/* Event Name */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event_name">Event Name</Label>
                    <Field
                      as={Input}
                      id="event_name"
                      name="event_name"
                      placeholder="Enter event name"
                      className="w-full rounded-lg"
                    />
                    {errors.event_name && touched.event_name && (
                      <span className="text-red-400 italic text-sm">
                        {errors.event_name}
                      </span>
                    )}
                  </div>

                  {/* Total Seats */}
                  <div className="flex flex-col gap-2">
                    <Label>Total Seats</Label>
                    <Field
                      as={Input}
                      name="event_total_seats"
                      type="number"
                      placeholder="Total seats"
                      className="w-full rounded-lg"
                    />
                    {errors.event_total_seats && touched.event_total_seats && (
                      <span className="text-red-400 italic text-sm">
                        {errors.event_total_seats}
                      </span>
                    )}
                  </div>

                  {/* Category */}
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
                    {errors.event_category && touched.event_category && (
                      <span className="text-red-400 italic text-sm">
                        {errors.event_category}
                      </span>
                    )}
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event_location">Location</Label>
                    <Field
                      as={Input}
                      id="event_location"
                      name="event_location"
                      placeholder="Enter a specific event location"
                      className="w-full rounded-lg"
                    />
                    {errors.event_location && touched.event_location && (
                      <span className="text-red-400 italic text-sm">
                        {errors.event_location}
                      </span>
                    )}
                  </div>

                  {/* Thumbnail */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event_thumbnail">Event Thumbnail</Label>
                    <Input
                      id="event_thumbnail"
                      type="file"
                      accept="image/*"
                      className="w-full rounded-lg"
                      onChange={(e) =>
                        setFieldValue(
                          "event_thumbnail",
                          e.target.files?.[0] || null
                        )
                      }
                    />
                    {errors.event_thumbnail && touched.event_thumbnail && (
                      <span className="text-red-400 italic text-sm">
                        {errors.event_thumbnail}
                      </span>
                    )}
                  </div>

                  {/* Description */}
                  <div className="flex flex-col gap-2">
                    <Label htmlFor="event_description">Description</Label>
                    <Field
                      as={Textarea}
                      id="event_description"
                      name="event_description"
                      placeholder="Write about the event..."
                      className="w-full h-50 rounded-lg"
                    />
                    {errors.event_description && touched.event_description && (
                      <span className="text-red-400 italic text-sm">
                        {errors.event_description}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Label>Date</Label>
                  <Calendar
                    mode="range"
                    selected={date}
                    onSelect={(range) => {
                      if (range) {
                        setFieldValue("event_start_date", range.from || null);
                        setFieldValue(
                          "event_end_date",
                          range.to || range.from || null
                        );
                        setDate(range);
                      }
                    }}
                    numberOfMonths={1}
                    className="rounded-lg border w-full"
                    disabled={(d) => {
                      const today = new Date();
                      const yesterday = new Date(today);
                      yesterday.setDate(today.getDate() - 1);
                      return d < yesterday;
                    }}
                  />
                  <div className="flex justify-center items-center text-sm text-gray-600 mt-2 border border-neutral-200 rounded-lg h-10 px-4">
                    {values.event_start_date && values.event_end_date ? (
                      <span className="font-medium">
                        {format(values.event_start_date, "PPP")} -{" "}
                        {format(values.event_end_date, "PPP")}
                      </span>
                    ) : (
                      <span className="text-neutral-600">No date selected</span>
                    )}
                  </div>
                  {errors.event_start_date && touched.event_start_date && (
                    <span className="text-red-400 italic text-sm">
                      {errors.event_start_date}
                    </span>
                  )}

                  <div className="mt-4 border-t pt-4 flex flex-col gap-2">
                    <Label>Tickets (in IDR)</Label>
                    <div className="border border-neutral-200 rounded-lg">
                      {/* Regular Ticket */}
                      <div className="flex gap-4 m-3 items-center">
                        <span className="w-30 capitalize font-medium">
                          Regular
                        </span>

                        {/* Price */}
                        <div>
                          <Field
                            as={Input}
                            id="regular_price"
                            name="tickets[0].ticket_price"
                            type="number"
                            placeholder="Price"
                            className="rounded-lg flex-1"
                          />
                          {(errors.tickets?.[0] as FormikErrors<ITicket>)
                            ?.ticket_price &&
                            touched.tickets?.[0]?.ticket_price && (
                              <span className="text-red-400 italic text-sm">
                                {
                                  (errors.tickets?.[0] as FormikErrors<ITicket>)
                                    ?.ticket_price
                                }
                              </span>
                            )}
                        </div>

                        {/* Quota */}
                        <div>
                          <Field
                            as={Input}
                            id="regular_quota"
                            name="tickets[0].ticket_quota"
                            type="number"
                            placeholder="Quota"
                            className="rounded-lg flex-1"
                          />
                          {(errors.tickets?.[0] as FormikErrors<ITicket>)
                            ?.ticket_quota &&
                            touched.tickets?.[0]?.ticket_quota && (
                              <span className="text-red-400 italic text-sm">
                                {
                                  (errors.tickets?.[0] as FormikErrors<ITicket>)
                                    ?.ticket_quota
                                }
                              </span>
                            )}
                        </div>
                      </div>

                      {/* VIP Ticket */}
                      <div className="flex gap-4 m-3 items-center">
                        <span className="w-30 capitalize font-medium">VIP</span>

                        {/* Price */}
                        <div>
                          <Field
                            as={Input}
                            id="vip_price"
                            name="tickets[1].ticket_price"
                            type="number"
                            placeholder="Price"
                            className="rounded-lg flex-1"
                          />
                          {(errors.tickets?.[1] as FormikErrors<ITicket>)
                            ?.ticket_price &&
                            touched.tickets?.[1]?.ticket_price && (
                              <span className="text-red-400 italic text-sm">
                                {
                                  (errors.tickets?.[1] as FormikErrors<ITicket>)
                                    ?.ticket_price
                                }
                              </span>
                            )}
                        </div>

                        {/* Quota */}
                        <div>
                          <Field
                            as={Input}
                            id="vip_quota"
                            name="tickets[1].ticket_quota"
                            type="number"
                            placeholder="Quota"
                            className="rounded-lg flex-1"
                          />
                          {(errors.tickets?.[1] as FormikErrors<ITicket>)
                            ?.ticket_quota &&
                            touched.tickets?.[1]?.ticket_quota && (
                              <span className="text-red-400 italic text-sm">
                                {
                                  (errors.tickets?.[1] as FormikErrors<ITicket>)
                                    ?.ticket_quota
                                }
                              </span>
                            )}
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
                    Create Event
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
