"use client";
import { useState, useEffect } from "react";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiCall } from "@/helper/axios";
import {
  ITransactionForm,
  transactionValidationSchema,
} from "./TransactionSchema";
import { useParams, useRouter } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";

interface IEventTicket {
  id: number;
  ticket_type: string;
  price: number;
  available_qty: number;
}

interface IVoucher {
  id: number;
  voucher_code: string;
  discount_value: number;
}

interface ICoupon {
  id: number;
  coupon_code: string;
  discount_value: number;
}

interface IPoint {
  id: number;
  point_balance: number;
}

export default function CreateTransactionPage() {
  const initialValues: ITransactionForm = {
    tickets: [{ ticket_id: 0, qty: 1 }],
    voucherId: undefined,
    couponId: undefined,
    pointId: undefined,
  };

  const [loading, setLoading] = useState(false);
  const [eventTickets, setEventTickets] = useState<IEventTicket[]>([]);
  const [vouchers, setVouchers] = useState<IVoucher[]>([]);
  const [coupons, setCoupons] = useState<ICoupon[]>([]);
  const [points, setPoints] = useState<IPoint[]>([]);
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;

  useEffect(() => {
    const token = localStorage.getItem("token");

    // Decode JWT to get user ID
    const getUserIdFromToken = (token: string): number | null => {
      try {
        const payload = token.split(".")[1];
        const decodedPayload = JSON.parse(atob(payload));
        return decodedPayload.id || null;
      } catch (err) {
        console.error("Failed to decode JWT", err);
        return null;
      }
    };

    const userId = token ? getUserIdFromToken(token) : null;
    if (!userId) return;

    const fetchTickets = async () => {
      try {
        const { data } = await apiCall.get(`/ticket/event/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventTickets(data.tickets);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchVouchers = async () => {
      try {
        const { data } = await apiCall.get(`/voucher/event/${eventId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setVouchers(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchCoupons = async () => {
      try {
        const { data } = await apiCall.get(`/coupon/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCoupons(data);
      } catch (err) {
        console.error(err);
      }
    };

    const fetchPoints = async () => {
      try {
        const { data } = await apiCall.get(`/point/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPoints(data);
      } catch (err) {
        console.error(err);
      }
    };

    if (eventId) {
      fetchTickets();
      fetchVouchers();
      fetchCoupons();
      fetchPoints();
    }
  }, [eventId]);

  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <div className="flex justify-center w-full">
        <Card className="w-full max-w-2xl p-6 mt-8 bg-white shadow rounded-3xl ouline-1 outline-neutral-600">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#09431C] w-full">
            Create Transaction
          </h1>

          <Formik
            initialValues={initialValues}
            validationSchema={transactionValidationSchema}
            onSubmit={async (values, { resetForm }) => {
              setLoading(true);
              try {
                const payload = {
                  tickets: values.tickets.map((t: any) => ({
                    ticket_id: Number(t.ticket_id),
                    qty: Number(t.qty),
                  })),
                  pointId: values.pointId ? Number(values.pointId) : null,
                  couponId: values.couponId ? Number(values.couponId) : null,
                  voucherId: values.voucherId ? Number(values.voucherId) : null,
                };

                const token = localStorage.getItem("token");
                const { data } = await apiCall.post("/transaction", payload, {
                  headers: { Authorization: `Bearer ${token}` },
                });

                const transaction = data.transaction; // get created transaction

                alert("Transaction created successfully!");
                resetForm();

                // Redirect to transaction detail page
                router.push(`/transaction-detail/${transaction.id}`);
              } catch (error: any) {
                console.error(error);
                alert(
                  "Failed to create transaction: " +
                    (error.response?.data?.message || error.message)
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            {({ values, setFieldValue }) => (
              <Form className="w-full flex flex-col gap-6">
                <div className="flex flex-col gap-4 lg:col-span-2 w-full">
                  {values.tickets.map((ticket, index) => (
                    <div
                      key={index}
                      className="flex flex-col lg:flex-row gap-4 items-start border border-neutral-200 p-3 rounded-lg w-full"
                    >
                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <Label>Ticket</Label>
                        <Select
                          onValueChange={(val) =>
                            setFieldValue(
                              `tickets[${index}].ticket_id`,
                              Number(val)
                            )
                          }
                          value={
                            values.tickets[index].ticket_id
                              ? String(values.tickets[index].ticket_id)
                              : ""
                          }
                        >
                          <SelectTrigger className="w-full rounded-lg">
                            <SelectValue placeholder="Select a ticket" />
                          </SelectTrigger>
                          <SelectContent>
                            {eventTickets.map((t) => {
                              const isSelectedElsewhere = values.tickets.some(
                                (ticket, i) =>
                                  i !== index &&
                                  Number(ticket.ticket_id) === t.id
                              );
                              return (
                                <SelectItem
                                  key={t.id}
                                  value={String(t.id)}
                                  disabled={
                                    t.available_qty === 0 || isSelectedElsewhere
                                  }
                                >
                                  {t.ticket_type} - Rp
                                  {new Intl.NumberFormat("id-ID").format(
                                    t.price
                                  )}{" "}
                                  {t.available_qty === 0
                                    ? "(Sold Out)"
                                    : isSelectedElsewhere
                                    ? "(Already chosen)"
                                    : ""}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                        <ErrorMessage
                          name={`tickets[${index}].ticket_id`}
                          component="div"
                          className="text-red-400 text-sm italic"
                        />
                      </div>

                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <Label>Quantity</Label>
                        <Field
                          as={Input}
                          type="number"
                          name={`tickets[${index}].qty`}
                          placeholder="Quantity"
                          min={1}
                          max={
                            eventTickets.find(
                              (t) => t.id === values.tickets[index].ticket_id
                            )?.available_qty || 1
                          }
                          className="rounded-lg w-full"
                        />
                        <ErrorMessage
                          name={`tickets[${index}].qty`}
                          component="div"
                          className="text-red-400 text-sm italic"
                        />
                      </div>
                    </div>
                  ))}

                  {values.tickets.length < 2 && (
                    <Button
                      type="button"
                      variant="link"
                      className="w-full text-[#6FB229] cursor-pointer"
                      onClick={() =>
                        setFieldValue("tickets", [
                          ...values.tickets,
                          { ticket_id: "", qty: 1 },
                        ])
                      }
                    >
                      + Add Ticket
                    </Button>
                  )}

                  {/* Voucher Dropdown */}
                  <div className="flex flex-col gap-2 w-full">
                    <Label>Voucher</Label>
                    <Select
                      onValueChange={(val) =>
                        setFieldValue("voucherId", Number(val))
                      }
                      value={values.voucherId ? String(values.voucherId) : ""}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Use voucher" />
                      </SelectTrigger>
                      <SelectContent>
                        {vouchers.length > 0 ? (
                          vouchers.map((v) => (
                            <SelectItem key={v.id} value={String(v.id)}>
                              {v.voucher_code} - {v.discount_value}%
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-voucher" disabled>
                            No vouchers available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Coupon Dropdown */}
                  <div className="flex flex-col gap-2 w-full">
                    <Label>Coupon</Label>
                    <Select
                      onValueChange={(val) =>
                        setFieldValue("couponId", Number(val))
                      }
                      value={values.couponId ? String(values.couponId) : ""}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Use coupon" />
                      </SelectTrigger>
                      <SelectContent>
                        {coupons.length > 0 ? (
                          coupons.map((c) => (
                            <SelectItem key={c.id} value={String(c.id)}>
                              {c.coupon_code} - {c.discount_value}%
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-coupon" disabled>
                            No coupons available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Point Dropdown */}
                  <div className="flex flex-col gap-2 w-full">
                    <Label>Point</Label>
                    <Select
                      onValueChange={(val) =>
                        setFieldValue("pointId", Number(val))
                      }
                      value={values.pointId ? String(values.pointId) : ""}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Use point" />
                      </SelectTrigger>
                      <SelectContent>
                        {points.length > 0 ? (
                          points.map((p) => (
                            <SelectItem key={p.id} value={String(p.id)}>
                              {new Intl.NumberFormat("id-ID").format(
                                p.point_balance
                              )}{" "}
                              points
                            </SelectItem>
                          ))
                        ) : (
                          <SelectItem value="no-point" disabled>
                            No points available
                          </SelectItem>
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="lg:col-span-3 w-full">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg cursor-pointer"
                  >
                    {loading ? "Creating..." : "Create Transaction"}
                  </Button>
                </div>
              </Form>
            )}
          </Formik>
        </Card>
      </div>
    </div>
  );
}
