"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { apiCall } from "@/helper/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Formik, Form, Field, ErrorMessage } from "formik";
import { voucherValidationSchema } from "./VoucherSchema";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

export default function CreateVoucherPage() {
  const router = useRouter();
  const params = useParams();
  const eventId = params.eventId as string;
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");

  const initialValues = {
    voucher_code: "",
    discount_value: "",
    voucher_start_date: null,
    voucher_end_date: null,
  };

  const handleSubmit = async (values: typeof initialValues) => {
    setLoading(true);
    try {
      await apiCall.post(`/voucher/create/${eventId}`, {
        voucher_code: values.voucher_code,
        discount_value: Number(values.discount_value),
        voucher_start_date: values.voucher_start_date,
        voucher_end_date: values.voucher_end_date,
      });

      setDialogMessage("Voucher created successfully!");
      setDialogOpen(true);
    } catch (err: any) {
      console.error(err.response?.data?.message);
      setDialogMessage(
        err.response?.data?.message || err.message || "Something went wrong"
      );
      setDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section>
      <div className="max-w-md mx-auto mt-10 p-6 bg-white shadow rounded-3xl">
        <h1 className="text-3xl font-bold mb-4 text-center text-[#09431C]">
          Create Voucher
        </h1>

        <Formik
          initialValues={initialValues}
          validationSchema={voucherValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, handleChange, setFieldValue }) => (
            <Form className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <Label>Voucher Code</Label>
                <Field
                  as={Input}
                  name="voucher_code"
                  placeholder="Create an unique code"
                  value={values.voucher_code}
                  onChange={handleChange}
                  className="rounded-lg"
                />
                <ErrorMessage
                  name="voucher_code"
                  component="div"
                  className="text-red-400 text-sm italic"
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label>Voucher Discount</Label>
                <Field
                  as={Input}
                  type="number"
                  name="discount_value"
                  placeholder="Discount (in %)"
                  value={values.discount_value}
                  onChange={handleChange}
                  className="rounded-lg"
                  min={0}
                  max={100}
                />
                <ErrorMessage
                  name="discount_value"
                  component="div"
                  className="text-red-400 text-sm italic"
                />
              </div>

              {/* Voucher Start Date */}
              <div className="flex flex-col gap-2">
                <Label>Voucher Start Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-lg",
                        !values.voucher_start_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {values.voucher_start_date
                        ? format(values.voucher_start_date, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={values.voucher_start_date || undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Normalize to UTC midnight
                          const utcDate = new Date(
                            Date.UTC(
                              date.getFullYear(),
                              date.getMonth(),
                              date.getDate()
                            )
                          );
                          setFieldValue("voucher_start_date", utcDate);
                        }
                      }}
                      disabled={(d) => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        return d < yesterday;
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <ErrorMessage
                  name="voucher_start_date"
                  component="div"
                  className="text-red-400 text-sm italic"
                />
              </div>

              {/* Voucher Expired Date */}
              <div className="flex flex-col gap-2">
                <Label>Voucher Expired Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal rounded-lg",
                        !values.voucher_end_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {values.voucher_end_date
                        ? format(values.voucher_end_date, "PPP")
                        : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={values.voucher_end_date || undefined}
                      onSelect={(date) => {
                        if (date) {
                          // Normalize to UTC midnight
                          const utcDate = new Date(
                            Date.UTC(
                              date.getFullYear(),
                              date.getMonth(),
                              date.getDate()
                            )
                          );
                          setFieldValue("voucher_end_date", utcDate);
                        }
                      }}
                      disabled={(d) => {
                        const today = new Date();
                        const yesterday = new Date(today);
                        yesterday.setDate(today.getDate() - 1);
                        return d < yesterday;
                      }}
                    />
                  </PopoverContent>
                </Popover>
                <ErrorMessage
                  name="voucher_end_date"
                  component="div"
                  className="text-red-400 text-sm italic"
                />
              </div>

              {errorMessage && (
                <p className="text-red-400 text-sm italic">{errorMessage}</p>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
              >
                {loading ? "Creating..." : "Create Voucher"}
              </Button>
            </Form>
          )}
        </Formik>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md !rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-3xl text-[#09431C]">
              Create Voucher
            </DialogTitle>
            <DialogDescription className="text-lg">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              onClick={() => {
                setDialogOpen(false);
                if (dialogMessage === "Voucher created successfully!") {
                  router.replace("/event-organizer/event-management");
                }
              }}
              className="bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
            >
              OK
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
