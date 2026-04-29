"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
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
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";

import { apiCall, checkBackendHealth } from "@/helper/axios";
import { formatCurrency } from "@/lib/utils";
// DebugTools removed

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

// Transform data to expected structure - handles both Prisma nested objects and raw SQL rows
const transformTransactionData = (rawData: any[]): Transaction[] => {
  if (!Array.isArray(rawData)) return [];
  if (rawData.length === 0) return [];

  // Detect if data is already in Prisma nested format (has .user object and .tickets array)
  const firstItem = rawData[0];
  if (firstItem.user && typeof firstItem.user === "object" && Array.isArray(firstItem.tickets)) {
    // Prisma nested format - map directly
    return rawData.map((t: any) => ({
      id: t.id,
      user_id: t.user_id,
      status: t.status,
      total_price: t.total_price,
      payment_proof_url: t.payment_proof_url,
      transaction_date_time: t.transaction_date_time,
      is_accepted: t.is_accepted,
      user: {
        id: t.user?.id || t.user_id,
        username: t.user?.username || "Unknown",
        email: t.user?.email || "",
      },
      tickets: (t.tickets || []).map((tt: any) => ({
        qty: tt.qty,
        subtotal_price: tt.subtotal_price,
        ticket: {
          ticket_type: tt.ticket?.ticket_type || "",
          price: tt.ticket?.price || 0,
          event: {
            event_name: tt.ticket?.event?.event_name || "",
            event_location: tt.ticket?.event?.event_location || "Unknown Location",
          },
        },
      })),
    }));
  }

  // Raw SQL flat row format - group by transaction ID
  const transactionMap = new Map<number, any>();

  rawData.forEach((row: any) => {
    const transactionId = row.id;

    if (!transactionMap.has(transactionId)) {
      // Create base transaction structure
      transactionMap.set(transactionId, {
        id: row.id,
        user_id: row.user_id,
        status: row.status,
        total_price: row.total_price,
        payment_proof_url: row.payment_proof_url,
        transaction_date_time: row.transaction_date_time,
        is_accepted: row.is_accepted,
        user: {
          id: row.user_id,
          username: row.username,
          email: row.email,
        },
        tickets: [],
      });
    }

    // Add ticket to existing transaction
    const transaction = transactionMap.get(transactionId);
    transaction.tickets.push({
      qty: row.qty,
      subtotal_price: row.subtotal_price,
      ticket: {
        ticket_type: row.ticket_type,
        price: row.price,
        event: {
          event_name: row.event_name,
          event_location: row.event_location,
        },
      },
    });
  });

  return Array.from(transactionMap.values());
};

const getInitials = (name: string) => {
  const parts = name.trim().split(/\s+/).slice(0, 2);
  return parts.map((p) => p[0]?.toUpperCase() || "").join("") || "U";
};

function TransactionManagementContent() {
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
  const [backendError, setBackendError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    const status = searchParams.get("status");
    const q = searchParams.get("q");
    if (status) setStatusFilter(status);
    if (q !== null) setSearchTerm(q);

    // Check if user is authenticated before making API calls
    const token = localStorage.getItem("token");
    const user = localStorage.getItem("user");

    if (!token || !user) {
      setBackendError(
        "Authentication required. Please log in to view transactions."
      );
      setLoading(false);
      return;
    }

    fetchTransactions();
    fetchStats();
  }, [searchParams]);

  // Keep URL in sync when filters change
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    if (!searchTerm) params.delete("q");
    else params.set("q", searchTerm);
    if (!statusFilter || statusFilter === "all") params.delete("status");
    else params.set("status", statusFilter);
    const query = params.toString();
    router.replace(query ? `${pathname}?${query}` : pathname, {
      scroll: false,
    });
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const fetchTransactions = async () => {
    try {
      const response = await apiCall.get("/transaction/organizer/transactions");

      // Transform raw SQL data to expected structure
      const transformedTransactions = transformTransactionData(
        response.data.transactions || response.data
      );

      setTransactions(transformedTransactions);
      setBackendError(null);
    } catch (error: any) {
      console.error("❌ Error fetching transactions:", error);
      console.error("❌ Error details:", {
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        message: error.message,
        config: {
          url: error.config?.url,
          method: error.config?.method,
          headers: error.config?.headers,
        },
      });

      // Set error message for user
      if (error.response?.status === 400) {
        setBackendError(
          "Invalid request. Please check your authentication and try again."
        );
      } else if (error.response?.status === 401) {
        setBackendError("Authentication required. Please log in again.");
      } else if (error.response?.status === 404) {
        setBackendError("API endpoint not found. Please contact support.");
      } else if (
        error.code === "ECONNABORTED" ||
        error.message === "Network Error"
      ) {
        setBackendError(
          "Cannot connect to server. Please check your internet connection and try again."
        );
      } else {
        setBackendError(
          "An error occurred while fetching transactions. Please try again later."
        );
      }

      // Set empty transactions array to prevent infinite loading
      setTransactions([]);
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

  // Compute total revenue from SUCCESS transactions only
  const totalRevenueSuccess = useMemo(() => {
    return transactions
      .filter((t) => t.status === "SUCCESS")
      .reduce((sum, t) => sum + (t.total_price || 0), 0);
  }, [transactions]);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading transactions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-md border border-gray-100 rounded-2xl mt-8 mb-8">
            <div className="px-6 py-7">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="space-y-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#09431C]">
                    Transaction Management
                  </h1>
                  <p className="text-gray-500 text-base">
                    Review and manage payment transactions with ease
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push("/event-organizer/pending-approval")
                    }
                    className="rounded-full border-2 border-[#09431C] hover:bg-[#c6ee9a] text-[#09431C] hover:text-[#09431C] font-medium"
                  >
                    <Clock className="w-4 h-4 mr-2" />
                    Pending Approval
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="space-y-8">
            {/* Debug tools removed */}

            {/* Error Display */}
            {backendError && (
              <Card className="bg-red-50 border-red-200 border-2">
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <XCircle className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-red-800">
                        Connection Error
                      </h3>
                      <p className="text-red-700 mt-1">{backendError}</p>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={async () => {
                          const isHealthy = await checkBackendHealth();
                          if (isHealthy) {
                            setBackendError(null);
                            fetchTransactions();
                            fetchStats();
                          } else {
                            setBackendError(
                              "Backend server is not responding. Please check if the server is running."
                            );
                          }
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Test Connection
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setBackendError(null);
                          fetchTransactions();
                          fetchStats();
                        }}
                        className="border-red-300 text-red-700 hover:bg-red-100"
                      >
                        Retry
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Total Transactions
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {stats.total}
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <CreditCard className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    All time
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Pending Approval
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {stats.waiting_confirmation}
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <Clock className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3">
                    Need review
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Total Revenue
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {formatCurrency(totalRevenueSuccess)}
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <CreditCard className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 truncate">
                    Successful transactions
                  </p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-500 mb-1">
                        Pending Revenue
                      </p>
                      <div className="text-2xl font-bold text-gray-900 break-words">
                        {stats.pending_revenue
                          ? formatCurrency(stats.pending_revenue)
                          : "Rp 0"}
                      </div>
                    </div>
                    <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                      <CreditCard className="h-6 w-6 text-[#09431C]" />
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-3 truncate">
                    Awaiting approval
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Filters and Search */}
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-md">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[#09431C]" />
                  Filters & Search
                </CardTitle>
              </CardHeader>
              <CardContent className="flex items-center">
                <div className="flex flex-col md:flex-row gap-4 md:gap-6 items-center justify-center w-full">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                      <Input
                        placeholder="Search by user or event..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-12 py-2 rounded-full border-gray-200 focus:border-[#09431C] focus:ring-[#09431C] text-base"
                      />
                    </div>
                  </div>

                  <div className="w-full md:w-48 flex-shrink-0">
                    <Select
                      value={statusFilter}
                      onValueChange={setStatusFilter}
                    >
                      <SelectTrigger className="w-full py-2 rounded-full border-gray-200 focus:border-[#09431C] text-base">
                        <SelectValue placeholder="All Status" />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl">
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
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Transactions Table */}
            <div className="space-y-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                  Transaction List
                </h2>
              </div>
              <Card className="bg-white border border-gray-100 rounded-2xl shadow-md overflow-x-auto">
                <CardContent className="p-0">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 px-6">
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
                    <div className="min-w-[1000px]">
                      <div className="sticky top-0 z-10 grid grid-cols-12 gap-4 px-6 py-4 bg-[#09431C] text-white font-semibold border-b rounded-t-2xl">
                      <div className="col-span-3">User</div>
                      <div className="col-span-3">Event</div>
                      <div className="col-span-2">Amount & Date</div>
                      <div className="col-span-2 text-center">Status</div>
                      <div className="col-span-2 text-right">Actions</div>
                    </div>
                      <div>
                        {filteredTransactions.map((transaction, idx) => (
                          <div
                            key={transaction.id}
                            className={`grid grid-cols-12 gap-4 px-6 py-4 border-b items-center ${
                              idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                            } hover:bg-[#f9ffe9] transition-colors`}
                          >
                            {/* User */}
                            <div className="col-span-3 flex items-center gap-3 min-w-0">
                              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[#dff4be] text-[#0f3d00] flex items-center justify-center text-sm font-bold">
                                {getInitials(transaction.user.username)}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="font-semibold text-gray-900 truncate">
                                  {transaction.user.username}
                                </div>
                                <div className="text-xs text-gray-500 truncate" title={transaction.user.email}>
                                  {transaction.user.email}
                                </div>
                              </div>
                            </div>

                            {/* Event */}
                            <div className="col-span-3 min-w-0">
                              <div className="font-semibold text-gray-900 line-clamp-1" title={transaction.tickets[0]?.ticket.event.event_name}>
                                {transaction.tickets[0]?.ticket.event.event_name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-1 truncate">
                                <MapPin className="w-3 h-3 mr-1 flex-shrink-0 text-[#09431C]" />
                                <span className="truncate">{transaction.tickets[0]?.ticket.event.event_location}</span>
                              </div>
                            </div>

                            {/* Amount & Date */}
                            <div className="col-span-2">
                              <div className="font-bold text-[#09431C]">
                                {transaction.total_price ? formatCurrency(transaction.total_price) : "Rp 0"}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center mt-1">
                                <Clock className="w-3 h-3 mr-1 flex-shrink-0 text-[#09431C]" />
                                <span>
                                  {format(
                                    new Date(transaction.transaction_date_time),
                                    "dd MMM yyyy, HH:mm",
                                    { locale: id }
                                  )}
                                </span>
                              </div>
                            </div>

                            {/* Status */}
                            <div className="col-span-2 flex justify-center">
                              <Badge
                                className={`${getStatusColor(transaction.status)} px-3 py-1 rounded-full whitespace-nowrap text-xs shadow-sm`}
                              >
                                {transaction.status.replace(/_/g, " ")}
                              </Badge>
                            </div>

                            {/* Actions */}
                            <div className="col-span-2 flex items-center justify-end gap-2">
                              <Button
                                variant="outline"
                                size="icon"
                                title="View Proof"
                                onClick={() => showPaymentProof(transaction)}
                                className="h-8 w-8 rounded-full border border-[#09431C] text-[#09431C] hover:bg-[#c6ee9a] hover:text-[#09431C] transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>

                              {transaction.status === "WAITING_CONFIRMATION" && (
                                <>
                                  <Button
                                    size="icon"
                                    title="Accept"
                                    onClick={() => handleAcceptTransaction(transaction.id)}
                                    className="h-8 w-8 rounded-full bg-[#8ec357]/20 text-[#09431C] hover:bg-[#8ec357]/40 border border-[#8ec357] transition-colors"
                                  >
                                    <CheckCircle className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    size="icon"
                                    title="Reject"
                                    onClick={() => openRejectModal(transaction)}
                                    className="h-8 w-8 rounded-full bg-red-100 text-red-700 hover:bg-red-200 border border-red-200 transition-colors"
                                  >
                                    <XCircle className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                              {transaction.status === "SUCCESS" && (
                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-[#8ec357]/20 text-[#09431C] border border-[#8ec357]" title="Accepted">
                                  <CheckCircle className="w-4 h-4" />
                                </div>
                              )}
                              {transaction.status === "REJECTED" && (
                                <div className="h-8 w-8 flex items-center justify-center rounded-full bg-red-100 text-red-700 border border-red-200" title="Rejected">
                                  <XCircle className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                )}
              </CardContent>
            </Card>
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
                    {selectedTransaction.total_price
                      ? formatCurrency(selectedTransaction.total_price)
                      : "Rp 0"}
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
                  className="rounded-full bg-[#09431C] hover:bg-[#09431C]/90 text-white px-6 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-300"
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
                  className="rounded-full border-2 border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-6 py-2 transition-all duration-300"
                >
                  Cancel
                </Button>
                <Button
                  onClick={() =>
                    handleRejectTransaction(selectedTransaction.id)
                  }
                  className="rounded-full bg-red-500 hover:bg-red-600 text-white px-6 py-2 font-medium shadow-md hover:shadow-lg transition-all duration-300"
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

export default function TransactionManagementPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">
              Loading transaction management...
            </p>
          </div>
        </div>
      }
    >
      <TransactionManagementContent />
    </Suspense>
  );
}
