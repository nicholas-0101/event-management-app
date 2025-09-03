"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiCall } from "@/helper/axios";
import slugify from "slugify";
import { LoaderIcon, SearchX } from "lucide-react";

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
}

// Helper to decode JWT token and get user ID
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

export default function TransactionHistoryPage() {
  const [transactions, setTransactions] = useState<ITransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        if (!token) return;

        const userId = getUserIdFromToken(token);
        if (!userId) return;

        const { data } = await apiCall.get(`/transaction/user/${userId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setTransactions(data.transactions || []);
      } catch (err) {
        console.error(err);
        alert("Failed to fetch transactions");
      } finally {
        setLoading(false);
      }
    };
    fetchTransactions();
  }, []);

  const getBadgeColor = (status: string) => {
    switch (status) {
      case "WAITING_PAYMENT":
      case "WAITING_CONFIRMATION":
        return "bg-yellow-200 text-yellow-700 outline-2 outline-yellow-600";
      case "REJECTED":
      case "CANCELLED":
      case "EXPIRED":
        return "bg-red-200 text-red-900 outline-2 outline-red-800";
      case "SUCCESS":
        return "bg-lime-200 text-lime-900 outline-2 outline-lime-900";
      default:
        return "bg-gray-300 text-gray-800 outline-2 outline-gray-800";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br p-6 pt-4 flex flex-col items-center gap-6">
      <h1 className="text-3xl font-bold text-[#09431C]">Transaction History</h1>

      {loading ? (
        <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
          <LoaderIcon color="#525252" size={200} />
          Loading transactions...
        </p>
      ) : transactions.length === 0 ? (
        <p className="pt-4 text-neutral-600 text-center text-3xl font-medium flex flex-col gap-2 justify-center items-center">
            <SearchX color="#525252" size={200} /> No Transactions Found
          </p>
      ) : (
        transactions.map((transaction) => (
          <Card
            key={transaction.id}
            className="w-full max-w-xl p-6 bg-white rounded-3xl shadow flex flex-col gap-4"
          >
            <div className="flex justify-between items-center">
              <p>
                <strong>Username:</strong> {transaction.user.username}
              </p>
              <Badge
                className={`rounded-full text-sm font-semibold ${getBadgeColor(
                  transaction.status
                )}`}
              >
                {transaction.status.replace("_", " ")}
              </Badge>
            </div>

            <div>
              <strong>Tickets</strong>
              <ul className="list-disc pl-5">
                {transaction.tickets.map((t) => (
                  <li key={t.ticket_id} className="text-white">
                    <div className="flex justify-between text-black font-bold">
                      <span>
                        {t.ticket.event.event_name} - {t.ticket.ticket_type}
                      </span>
                      <span>x{t.qty}</span>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            <div className="flex justify-between font-semibold text-[#6FB229] text-lg">
              <span>Total Price:</span>
              <span>Rp {transaction.total_price.toLocaleString("id-ID")}</span>
            </div>

            <div className="flex gap-4 mt-2">
              <Button
                type="button"
                className="w-full flex-1 border-2 border-[#6FB229] bg-transparent hover:bg-[#6FB229]/20 text-[#6FB229] rounded-lg cursor-pointer"
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

              <Button
                type="button"
                className="w-full flex-1 bg-[#6FB229] hover:bg-[#09431C] rounded-lg cursor-pointer"
                onClick={() => router.push(`/transaction-detail/${transaction.id}`)}
              >
                View Transaction
              </Button>
            </div>
          </Card>
        ))
      )}
    </div>
  );
}
