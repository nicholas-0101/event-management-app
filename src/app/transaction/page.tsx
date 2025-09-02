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

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function CreateTransactionPage() {
  const initialValues: ITransactionForm = {
    tickets: [{ ticket_id: 0, qty: 1 }],
    voucherId: undefined,
    couponId: undefined,
    pointId: undefined,
  };

  const [loading, setLoading] = useState(false);
  const [vouchers, setVouchers] = useState<{ id: number; code: string }[]>([]);
  const [coupons, setCoupons] = useState<{ id: number; code: string }[]>([]);
  const [points, setPoints] = useState<{ id: number; balance: number }[]>([]);

  // fetch options from backend
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [voucherRes, couponRes, pointRes] = await Promise.all([
          apiCall.get("/voucher"), // return available vouchers
          apiCall.get("/coupon"), // return available coupons
          apiCall.get("/points"), // return available points
        ]);
        setVouchers(voucherRes.data || []);
        setCoupons(couponRes.data || []);
        setPoints(pointRes.data || []);
      } catch (error) {
        console.error("Failed to fetch options", error);
      }
    };
    fetchOptions();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br p-6">
      <div className="flex justify-center w-full">
        <section className="w-full max-w-2xl p-6 mt-8 bg-white shadow rounded-3xl">
          <h1 className="text-3xl font-bold mb-6 text-center text-[#09431C] w-full">
            Transaction
          </h1>

          <Formik
            initialValues={initialValues}
            validationSchema={transactionValidationSchema}
            onSubmit={async (values, { resetForm }) => {
              setLoading(true);
              try {
                await apiCall.post("/transaction", values, {
                  headers: {
                    Authorization: `Bearer ${localStorage.getItem("token")}`,
                  },
                });
                alert("Transaction created successfully!");
                resetForm();
              } catch (error: any) {
                console.error("Transaction creation failed", error);
                alert(
                  "Failed to create transaction: " +
                    (error.response?.data?.message || error.message)
                );
              } finally {
                setLoading(false);
              }
            }}
          >
            {({ values, setFieldValue, errors, touched }) => (
              <Form className="w-full flex flex-col gap-6">
                <div className="flex flex-col gap-4 w-full">
                  {/* Tickets */}
                  {values.tickets.map((ticket, index) => (
                    <div
                      key={index}
                      className="flex flex-col lg:flex-row gap-4 items-start border border-neutral-200 p-3 rounded-lg"
                    >
                      <div className="flex-1 flex flex-col gap-1 w-full">
                        <Label>Ticket ID</Label>
                        <Field
                          as={Input}
                          type="number"
                          name={`tickets[${index}].ticket_id`}
                          placeholder="Ticket ID"
                          className="rounded-lg w-full"
                        />
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

                  <Button
                    type="button"
                    variant={"link"}
                    className="text-[#6FB229]"
                    onClick={() =>
                      setFieldValue("tickets", [
                        ...values.tickets,
                        { ticket_id: 0, qty: 1 },
                      ])
                    }
                  >
                    Add Ticket
                  </Button>

                  {/* Voucher */}
                  <div className="flex flex-col gap-2 w-full">
                    <Label>Voucher (optional)</Label>
                    <Select
                      onValueChange={(value) =>
                        setFieldValue(
                          "voucherId",
                          value ? Number(value) : undefined
                        )
                      }
                      value={values.voucherId?.toString() || ""}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Select voucher" />
                      </SelectTrigger>
                      <SelectContent>
                        {vouchers.map((v) => (
                          <SelectItem key={v.id} value={v.id.toString()}>
                            {v.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Coupon */}
                  <div className="flex flex-col gap-2 w-full">
                    <Label>Coupon (optional)</Label>
                    <Select
                      onValueChange={(value) =>
                        setFieldValue(
                          "couponId",
                          value ? Number(value) : undefined
                        )
                      }
                      value={values.couponId?.toString() || ""}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Select coupon" />
                      </SelectTrigger>
                      <SelectContent>
                        {coupons.map((c) => (
                          <SelectItem key={c.id} value={c.id.toString()}>
                            {c.code}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Points */}
                  <div className="flex flex-col gap-2 w-full">
                    <Label>Points (optional)</Label>
                    <Select
                      onValueChange={(value) =>
                        setFieldValue(
                          "pointId",
                          value ? Number(value) : undefined
                        )
                      }
                      value={values.pointId?.toString() || ""}
                    >
                      <SelectTrigger className="w-full rounded-lg">
                        <SelectValue placeholder="Select points" />
                      </SelectTrigger>
                      <SelectContent>
                        {points.map((p) => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.balance} points
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="w-full">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
                  >
                    {loading ? "Creating..." : "Create Transaction"}
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
