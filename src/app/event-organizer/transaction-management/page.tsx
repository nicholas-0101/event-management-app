"use client";

import React, { useState, useEffect } from "react";
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
  CreditCard,
  Users,
  Eye,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  MapPin,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import EOSidebar from "../core-components/eo-sidebar";
import { apiCall } from "@/helper/axios";

interface Transaction {
  id: number;
  user_id: number;
  status: string;
  total_price: number;
  payment_proof_url: string;
  transaction_date_time: string;
  is_accepted: boolean;
  user: {
    id: number;
    username: string;
    email: string;
  };
  tickets: Array<{
    qty: number;
    subtotal_price: number;
    ticket: {
      ticket_type: string;
      price: number;
      event: {
        event_name: string;
        event_location: string;
      };
    };
  }>;
}

interface TransactionStats {
  total: number;
  waiting_confirmation: number;
  success: number;
  rejected: number;
  expired: number;
  cancelled: number;
  total_revenue: number;
  pending_revenue: number;
}

export default function TransactionManagementPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [stats, setStats] = useState<TransactionStats>({
    total: 0,
    waiting_confirmation: 0,
    success: 0,
    rejected: 0,
    expired: 0,
    cancelled: 0,
    total_revenue: 0,
    pending_revenue: 0,
  });
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showProofModal, setShowProofModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const status = searchParams.get("status");
    if (status) {
      setStatusFilter(status);
    }
    fetchTransactions();
    fetchStats();
  }, [searchParams]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const fetchTransactions = async () => {
    try {
      const response = await apiCall.get("/transaction/organizer");
      setTransactions(response.data.transactions || []);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await apiCall.get("/transaction/organizer/stats");
      setStats(response.data.stats || stats);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (transaction) =>
          transaction.user.username
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.user.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          transaction.tickets.some((ticket) =>
            ticket.ticket.event.event_name
              .toLowerCase()
              .includes(searchTerm.toLowerCase())
          )
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleAcceptTransaction = async (transactionId: number) => {
    try {
      await apiCall.post(`/transaction/organizer/accept/${transactionId}`);
      // Update local state
      setTransactions(
        transactions.map((t) =>
          t.id === transactionId
            ? { ...t, status: "SUCCESS", is_accepted: true }
            : t
        )
      );
      fetchStats(); // Refresh stats
      alert("Transaction accepted successfully!");
    } catch (error) {
      console.error("Error accepting transaction:", error);
      alert("Error accepting transaction");
    }
  };

  const handleRejectTransaction = async (transactionId: number) => {
    if (!rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    try {
      await apiCall.post(`/transaction/organizer/reject/${transactionId}`, {
        rejection_reason: rejectionReason,
      });
      // Update local state
      setTransactions(
        transactions.map((t) =>
          t.id === transactionId
            ? { ...t, status: "REJECTED", is_accepted: false }
            : t
        )
      );
      fetchStats(); // Refresh stats
      setRejectionReason("");
      setShowRejectModal(false);
      setSelectedTransaction(null);
      alert("Transaction rejected successfully!");
    } catch (error) {
      console.error("Error rejecting transaction:", error);
      alert("Error rejecting transaction");
    }
  };

  const showPaymentProof = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowProofModal(true);
  };

  const openRejectModal = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowRejectModal(true);
  };

  const getStatusColor = (status: string) => {
    const colors = {
      WAITING_PAYMENT: "bg-yellow-100 text-yellow-800",
      WAITING_CONFIRMATION: "bg-orange-100 text-orange-800",
      SUCCESS: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
      EXPIRED: "bg-gray-100 text-gray-800",
      CANCELLED: "bg-gray-100 text-gray-800",
    };
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <EOSidebar />

      <div className="flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 rounded-lg mt-8 mb-8">
            <div className="px-6 py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-indigo-900 bg-clip-text text-transparent">
                    Transaction Management
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review and manage payment transactions with ease
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Total Transactions
                  </CardTitle>
                  <div className="p-2 bg-[#97d753] rounded-lg">
                    <CreditCard className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {stats.total}
                  </div>
                  <p className="text-sm text-gray-600">All time</p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Pending Approval
                  </CardTitle>
                  <div className="p-2 bg-[#c6ee9a] rounded-lg">
                    <Clock className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#00481a]">
                    {stats.waiting_confirmation}
                  </div>
                  <p className="text-sm text-gray-600">Need review</p>
                </CardContent>
              </Card>

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
                  <div className="text-3xl font-bold text-[#00481a]">
                    {formatCurrency(stats.total_revenue)}
                  </div>
                  <p className="text-sm text-gray-600">
                    From successful transactions
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Pending Revenue
                  </CardTitle>
                  <div className="p-2 bg-[#c6ee9a] rounded-lg">
                    <div className="text-white font-bold text-sm">Rp</div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-[#00481a]">
                    {formatCurrency(stats.pending_revenue)}
                  </div>
                  <p className="text-sm text-gray-600">Awaiting approval</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[#00481a]" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search by user or event..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 py-3 border-gray-200 focus:border-[#00481a] focus:ring-[#00481a] text-lg"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="py-3 border-gray-200 focus:border-[#00481a] focus:ring-[#00481a] text-lg">
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="WAITING_PAYMENT">
                        Waiting Payment
                      </SelectItem>
                      <SelectItem value="WAITING_CONFIRMATION">
                        Waiting Confirmation
                      </SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                      <SelectItem value="EXPIRED">Expired</SelectItem>
                      <SelectItem value="CANCELLED">Cancelled</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="flex items-center justify-end">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSearchTerm("");
                        setStatusFilter("all");
                      }}
                      className="border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium py-3 px-6 transition-all duration-300"
                    >
                      Clear Filters
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <CreditCard className="w-5 h-5 mr-2 text-blue-600" />
                  Transaction List
                </CardTitle>
              </CardHeader>
              <CardContent>
                {filteredTransactions.length === 0 ? (
                  <div className="text-center py-12">
                    <CreditCard className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No transactions found
                    </h3>
                    <p className="text-gray-600">
                      {transactions.length === 0
                        ? "No transactions available yet"
                        : "No transactions match your filters"}
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-gray-200">
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            User
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Event
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Amount
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Status
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Date
                          </th>
                          <th className="text-left py-3 px-4 font-semibold text-gray-900">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransactions.map((transaction) => (
                          <tr
                            key={transaction.id}
                            className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors duration-200"
                          >
                            <td className="py-4 px-4">
                              <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                  <User className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900">
                                    {transaction.user.username}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {transaction.user.email}
                                  </div>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="space-y-1">
                                <div className="font-medium text-gray-900">
                                  {
                                    transaction.tickets[0]?.ticket.event
                                      .event_name
                                  }
                                </div>
                                <div className="flex items-center text-sm text-gray-500">
                                  <MapPin className="w-4 h-4 mr-1" />
                                  {
                                    transaction.tickets[0]?.ticket.event
                                      .event_location
                                  }
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="font-semibold text-gray-900">
                                {formatCurrency(transaction.total_price)}
                              </div>
                              <div className="text-sm text-gray-500">
                                {transaction.tickets.length} ticket(s)
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <Badge
                                className={`${getStatusColor(
                                  transaction.status
                                )} px-3 py-1 text-sm font-medium`}
                              >
                                {transaction.status.replace(/_/g, " ")}
                              </Badge>
                            </td>
                            <td className="py-4 px-4">
                              <div className="text-sm text-gray-900">
                                {format(
                                  new Date(transaction.transaction_date_time),
                                  "PPP",
                                  { locale: id }
                                )}
                              </div>
                              <div className="text-xs text-gray-500">
                                {format(
                                  new Date(transaction.transaction_date_time),
                                  "HH:mm",
                                  { locale: id }
                                )}
                              </div>
                            </td>
                            <td className="py-4 px-4">
                              <div className="flex space-x-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => showPaymentProof(transaction)}
                                  className="border-2 border-gray-300 hover:border-blue-500 hover:bg-blue-50 text-gray-700 hover:text-blue-700 font-medium py-2 transition-all duration-300"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </Button>
                                {transaction.status ===
                                  "WAITING_CONFIRMATION" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        handleAcceptTransaction(transaction.id)
                                      }
                                      className="border-2 border-gray-300 hover:border-green-500 hover:bg-green-50 text-gray-700 hover:text-green-700 font-medium py-2 transition-all duration-300"
                                    >
                                      <CheckCircle className="w-4 h-4 mr-1" />
                                      Accept
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() =>
                                        openRejectModal(transaction)
                                      }
                                      className="border-2 border-gray-300 hover:border-red-500 hover:bg-red-50 text-gray-700 hover:text-red-700 font-medium py-2 transition-all duration-300"
                                    >
                                      <XCircle className="w-4 h-4 mr-1" />
                                      Reject
                                    </Button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      {/* Payment Proof Modal */}
      {showProofModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border-0 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm">
            <div className="mt-3">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Payment Proof - {selectedTransaction.user.username}
              </h3>

              <div className="mb-6">
                <img
                  src={selectedTransaction.payment_proof_url}
                  alt="Payment Proof"
                  className="w-full h-auto rounded-lg border-2 border-gray-200 shadow-lg"
                />
              </div>

              <div className="mb-6 space-y-2">
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Amount:
                  </span>
                  <span className="text-lg font-bold text-green-600">
                    {formatCurrency(selectedTransaction.total_price)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-gray-700">
                    Date:
                  </span>
                  <span className="text-sm text-gray-600">
                    {format(
                      new Date(selectedTransaction.transaction_date_time),
                      "PPP",
                      { locale: id }
                    )}
                  </span>
                </div>
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setShowProofModal(false)}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Close
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rejection Modal */}
      {showRejectModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-6 border-0 w-96 shadow-2xl rounded-xl bg-white/95 backdrop-blur-sm">
            <div className="mt-3">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">
                Reject Transaction
              </h3>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rejection Reason
                </label>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                  rows={3}
                  placeholder="Please provide a reason for rejection..."
                />
              </div>

              <div className="flex justify-end space-x-3">
                <Button
                  onClick={() => {
                    setShowRejectModal(false);
                    setRejectionReason("");
                    setSelectedTransaction(null);
                  }}
                  className="border-2 border-gray-300 hover:border-gray-400 hover:bg-gray-50 text-gray-700 font-medium px-6 py-2 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleRejectTransaction(selectedTransaction.id)
                  }
                  className="bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white px-6 py-2 font-medium shadow-lg hover:shadow-xl transition-all duration-300"
                >
                  Reject
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
