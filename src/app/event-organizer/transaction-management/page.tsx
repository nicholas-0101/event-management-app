"use client";

import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { apiCall } from "@/helper/axios";
import { formatCurrency } from "@/lib/utils";

interface Transaction {
  id: number;
  status: string;
  total: number;
}

interface Stats {
  total_transactions: number;
  successful_transactions: number;
  pending_transactions: number;
  failed_transactions: number;
  total_revenue: number;
}

export default function TransactionManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const response = await apiCall.get("/event-organizer/transactions");
        setTransactions(response.data.transactions || []);
        setStats(response.data.stats || null);
      } catch (error) {
        console.error("Error fetching transactions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  // Hitung revenue hanya dari transaksi sukses
  const totalRevenueSuccess = transactions
    .filter((t) => t.status === "SUCCESS")
    .reduce((acc, curr) => acc + curr.total, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Statistik */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Total Transactions */}
        <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Transactions
            </CardTitle>
            <div className="p-2 bg-[#97d753] rounded-lg">
              <div className="text-white font-bold text-sm">#</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#00481a]">
              {stats?.total_transactions || 0}
            </div>
            <p className="text-sm text-gray-600">All transactions recorded</p>
          </CardContent>
        </Card>

        {/* Successful Transactions */}
        <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Successful Transactions
            </CardTitle>
            <div className="p-2 bg-[#97d753] rounded-lg">
              <div className="text-white font-bold text-sm">✔</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#00481a]">
              {stats?.successful_transactions || 0}
            </div>
            <p className="text-sm text-gray-600">Completed successfully</p>
          </CardContent>
        </Card>

        {/* Pending Transactions */}
        <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Pending Transactions
            </CardTitle>
            <div className="p-2 bg-[#97d753] rounded-lg">
              <div className="text-white font-bold text-sm">⏳</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#00481a]">
              {stats?.pending_transactions || 0}
            </div>
            <p className="text-sm text-gray-600">Awaiting confirmation</p>
          </CardContent>
        </Card>

        {/* Total Revenue (SUCCESS only) */}
        <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-gray-700">
              Total Revenue
            </CardTitle>
            <div className="p-2 bg-[#97d753] rounded-lg">
              <div className="text-white font-bold text-sm">Rp</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold text-[#00481a] break-words">
              {formatCurrency(totalRevenueSuccess)}
            </div>
            <p className="text-sm text-gray-600">
              From successful transactions only
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Daftar Transaksi */}
      <Card className="bg-white/80 backdrop-blur-md border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-800">
            Recent Transactions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs uppercase bg-[#97d753] text-white">
                <tr>
                  <th scope="col" className="px-6 py-3">
                    ID
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3">
                    Total
                  </th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((t) => (
                  <tr
                    key={t.id}
                    className="bg-white border-b hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap">
                      {t.id}
                    </td>
                    <td className="px-6 py-4">
                      <Badge
                        variant={
                          t.status === "SUCCESS"
                            ? "default"
                            : t.status === "PENDING"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {t.status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4">{formatCurrency(t.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
