"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { apiCall } from "@/helper/axios";
import { Card } from "@/components/ui/card";
import slugify from "slugify";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ITransaction {
  id: number;
  user: { username: string };
  tickets: {
    id: number;
    ticket_id: number;
    qty: number;
    ticket: {
      ticket_type: "VIP" | "REGULAR";
      event: { event_name: string };
    };
  }[];
  status: string;
  points_used: number;
  discount_voucher: number;
  discount_coupon: number;
  total_price: number;
  transaction_date_time: string;
  transaction_expired: string;
  payment_proof_url: string | null;
}

export default function TransactionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const transactionId = params?.id as string;

  const [transaction, setTransaction] = useState<ITransaction | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [loadingCancel, setLoadingCancel] = useState(false);
  const [expired, setExpired] = useState(false);
  const [timeLeft, setTimeLeft] = useState<number>(0); // in milliseconds
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState("");
  const [dialogTitle, setDialogTitle] = useState("Notice");
  const [dialogAction, setDialogAction] = useState<(() => void) | null>(null);

  useEffect(() => {
    const fetchTransaction = async () => {
      try {
        const token = localStorage.getItem("token");
        const { data } = await apiCall.get<ITransaction>(
          `/transaction/${transactionId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setTransaction(data);

        const now = new Date();
        const expire = new Date(data.transaction_expired);
        if (now >= expire || data.status === "EXPIRED") setExpired(true);
      } catch (err) {
        console.error(err);
        setDialogTitle("Error");
        setDialogMessage("Failed to fetch transaction info");
        setDialogOpen(true);
      }
    };

    fetchTransaction();
  }, [transactionId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!file) {
      setDialogTitle("Upload Failed");
      setDialogMessage("Please select a file first");
      setDialogOpen(true);
      return;
    }
    if (expired) {
      setDialogTitle("Upload Failed");
      setDialogMessage("Cannot upload, transaction expired");
      setDialogOpen(true);
      return;
    }

    setLoadingUpload(true);
    try {
      const formData = new FormData();
      formData.append("payment_proof", file);

      const token = localStorage.getItem("token");
      await apiCall.post(
        `/transaction/upload-proof/${transactionId}`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setDialogTitle("Success");
      setDialogMessage("Payment proof uploaded successfully!");
      setDialogAction(() => () => router.push("/transaction-history"));
      setDialogOpen(true);
    } catch (err: any) {
      console.error(err);
      setDialogTitle("Error");
      setDialogMessage(
        "Failed to upload payment proof: " +
          (err.response?.data?.message || err.message)
      );
      setDialogOpen(true);
    } finally {
      setLoadingUpload(false);
    }
  };

  const handleCancel = async () => {
    if (!transaction) return;

    // open confirmation dialog first
    setDialogTitle("Cancel Transaction");
    setDialogMessage("Are you sure you want to cancel this transaction?");
    setDialogAction(() => async () => {
      try {
        setLoadingCancel(true);
        const token = localStorage.getItem("token");
        const { data } = await apiCall.post(
          `/transaction/cancel/${transaction.id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setDialogTitle("Success");
        setDialogMessage(data.message || "Transaction cancelled successfully");
        setTransaction({ ...transaction, status: "CANCELLED" });
        setDialogAction(null);
      } catch (err: any) {
        console.error(err);
        setDialogTitle("Error");
        setDialogMessage(
          err.response?.data?.message || "Failed to cancel transaction"
        );
      } finally {
        setLoadingCancel(false);
      }
    });
    setDialogOpen(true);
  };

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    return `${hours.toString().padStart(2, "0")}:${minutes
      .toString()
      .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (!transaction) return;

    const now = new Date();
    const expireDate = new Date(transaction.transaction_expired);
    let diff = expireDate.getTime() - now.getTime();
    if (diff < 0) diff = 0;
    setTimeLeft(diff);

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1000) {
          clearInterval(timer);
          setExpired(true); // disable upload button
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [transaction]);

  return (
    <section>
      <div className="min-h-screen bg-gradient-to-br p-6 pt-4 flex justify-center items-center">
        <Card className="w-full max-w-xl p-6 bg-white rounded-3xl shadow flex flex-col gap-6 ouline-1 outline-neutral-600">
          <h1 className="text-3xl font-bold text-center text-[#09431C]">
            Transaction Detail
          </h1>

          {transaction && (
            <div className="space-y-10">
              <div className="space-y-4">
                <div className="flex md:flex-row flex-col gap-2 md:justify-between">
                  <p>
                    <strong>Username:</strong> {transaction.user.username}
                  </p>
                  <Badge
                    className={`rounded-full h-6 text-sm font-semibold ${
                      transaction.status === "WAITING_PAYMENT" ||
                      transaction.status === "WAITING_CONFIRMATION"
                        ? "bg-yellow-200 text-yellow-700 outline-2 outline-yellow-600"
                        : transaction.status === "REJECTED" ||
                          transaction.status === "CANCELLED" ||
                          transaction.status === "EXPIRED"
                        ? "bg-red-200 text-red-900 outline-2 outline-red-800"
                        : transaction.status === "SUCCESS"
                        ? "bg-lime-200 text-lime-900 outline-2 outline-lime-900"
                        : "bg-gray-300 text-gray-800 outline-2 outline-gray-800"
                    }`}
                  >
                    {transaction.status.replace("_", " ")}
                  </Badge>
                </div>

                <div>
                  <strong>Tickets</strong>
                  <ul className="list-disc pl-5">
                    {transaction.tickets.map((t) => (
                      <li key={t.ticket_id} className="text-white">
                        <div className="text-black justify-between flex font-bold md:text-lg">
                          <span>
                            {t.ticket.event.event_name} - {t.ticket.ticket_type}
                          </span>
                          <span>x{t.qty}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold">Points Used</span>
                  <span>{transaction.points_used.toLocaleString("id-ID")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Discount Coupon</span>
                  <span>{transaction.discount_coupon}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Discount Voucher</span>
                  <span>{transaction.discount_voucher}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-[#6FB229] md:text-xl">
                    Total Price
                  </span>
                  <span className="font-semibold text-[#6FB229] md:text-xl">
                    Rp {transaction.total_price.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label>Payment Proof</Label>

            {transaction && ["WAITING_PAYMENT"].includes(transaction.status) ? (
              <>
                <input
                  type="file"
                  accept="image/*,application/pdf"
                  onChange={handleFileChange}
                  className="rounded-lg border border-neutral-300 p-2"
                />
                {file && (
                  <p className="text-sm text-gray-600">
                    Selected file: {file.name}
                  </p>
                )}
              </>
            ) : transaction?.payment_proof_url ? (
              <div className="rounded-lg">
                {transaction.payment_proof_url.endsWith(".pdf") ? (
                  <a
                    href={transaction.payment_proof_url}
                    target="_blank"
                    className="text-gray-500 underline"
                  >
                    View PDF
                  </a>
                ) : (
                  <img
                    src={transaction.payment_proof_url}
                    alt="Payment Proof"
                    className="max-h-60 mt-2 rounded-lg"
                  />
                )}
              </div>
            ) : (
              <p className="text-gray-500">No payment proof uploaded yet.</p>
            )}
            {transaction &&
              transaction.status === "WAITING_PAYMENT" &&
              timeLeft > 0 && (
                <p className="text-sm text-red-400">
                  Time left to upload payment proof:{" "}
                  <span className="text-md text-red-400 font-semibold">
                    {formatTime(timeLeft)}
                  </span>
                </p>
              )}

            {transaction &&
              transaction.status === "WAITING_PAYMENT" &&
              timeLeft === 0 && (
                <p className="text-sm text-red-400 font-semibold">
                  Transaction expired
                </p>
              )}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex flex-col sm:flex-row gap-4">
              {transaction && transaction.tickets[0] && (
                <Button
                  type="button"
                  className="w-full flex-4 border-2 border-[#6FB229] bg-transparent hover:bg-[#6FB229]/20 text-[#6FB229] rounded-lg cursor-pointer"
                  onClick={() =>
                    router.push(
                      `/event-detail/${slugify(
                        transaction.tickets[0].ticket.event.event_name,
                        { lower: true }
                      )}`
                    )
                  }
                >
                  Show Event Detail
                </Button>
              )}
              <Button
                type="button"
                disabled={
                  loadingUpload ||
                  expired ||
                  !transaction ||
                  [
                    "EXPIRED",
                    "SUCCESS",
                    "REJECTED",
                    "CANCELLED",
                    "WAITING_CONFIRMATION",
                  ].includes(transaction.status)
                }
                className="w-full flex-4 bg-[#6FB229] hover:bg-[#09431C] rounded-lg cursor-pointer"
                onClick={handleSubmit}
              >
                {loadingUpload ? "Uploading..." : "Upload Payment Proof"}
              </Button>
              <Button
                type="button"
                disabled={
                  loadingCancel ||
                  expired ||
                  !transaction ||
                  ["EXPIRED", "SUCCESS", "REJECTED", "CANCELLED"].includes(
                    transaction.status
                  )
                }
                className="w-full flex-1 border-2 border-red-400 bg-transparent hover:bg-red-400/20 text-red-400 rounded-lg cursor-pointer"
                onClick={handleCancel}
              >
                {loadingCancel ? "Cancelling..." : "Cancel"}
              </Button>
            </div>
          </div>
        </Card>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md !rounded-3xl">
          <DialogHeader>
            <DialogTitle className="text-2xl text-[#09431C]">
              {dialogTitle}
            </DialogTitle>
            <DialogDescription className="text-lg">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            {dialogAction ? (
              <>
                <Button
                  variant="outline"
                  onClick={() => {
                    setDialogOpen(false);
                    setDialogAction(null);
                  }}
                  className="border-2 border-[#6FB229] bg-transparent hover:bg-[#6FB229]/20 text-[#6FB229] hover:text-[#6FB229] rounded-lg"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    setDialogOpen(false);
                    dialogAction?.();
                  }}
                  className="bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
                >
                  OK
                </Button>
              </>
            ) : (
              <Button
                onClick={() => {
                  setDialogOpen(false);
                  if (
                    dialogMessage === "Payment proof uploaded successfully!"
                  ) {
                    router.push("/transaction-history");
                  }
                }}
                className="bg-[#6FB229] hover:bg-[#09431C] rounded-lg"
              >
                OK
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}
