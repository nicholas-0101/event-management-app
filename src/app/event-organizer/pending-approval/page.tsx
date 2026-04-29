"use client";

import React, { useState, useEffect, Suspense } from "react";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  CheckCircle,
  XCircle,
  Search,
  Filter,
  Clock,
  User,
  Calendar,
  MapPin,
  CreditCard,
  Mail,
  Eye,
  AlertCircle,
} from "lucide-react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { format } from "date-fns";
import { id } from "date-fns/locale";

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
        event_start_date: string;
      };
    };
  }>;
}

// Transform raw SQL data to expected structure
const transformTransactionData = (rawData: any[]): Transaction[] => {
  if (!Array.isArray(rawData)) return [];

  // Group by transaction ID to handle multiple tickets per transaction
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
          event_start_date: row.event_start_date || row.transaction_date_time, // Fallback
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

function PendingApprovalContent() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [actionType, setActionType] = useState<"accept" | "reject" | null>(
    null
  );
  const [processing, setProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  // Initialize filters from URL parameters
  useEffect(() => {
    const status = searchParams.get("status");

    if (status) setStatusFilter(status);
  }, [searchParams]);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const fetchPendingTransactions = async () => {
    try {
      const response = await apiCall.get("/transaction/organizer/simple");

      // Transform raw SQL data to expected structure
      const transformedTransactions = transformTransactionData(
        response.data.transactions || response.data
      );

      // Filter only relevant statuses for pending approval
      const filteredTransactions = transformedTransactions.filter(
        (transaction: Transaction) =>
          transaction.status === "WAITING_CONFIRMATION" ||
          transaction.status === "SUCCESS" ||
          transaction.status === "REJECTED"
      );

      setTransactions(filteredTransactions);
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const updateURL = (status: string) => {
    const params = new URLSearchParams(searchParams);

    if (status && status !== "all") {
      params.set("status", status);
    } else {
      params.delete("status");
    }

    const newURL = `${pathname}?${params.toString()}`;
    router.replace(newURL);
  };

  const filterTransactions = () => {
    let filtered = transactions;

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

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (transaction) => transaction.status === statusFilter
      );
    }

    setFilteredTransactions(filtered);
  };

  const handleViewPaymentProof = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setShowPaymentModal(true);
  };

  const handleAcceptTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setActionType("accept");
    setShowConfirmModal(true);
  };

  const handleRejectTransaction = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setActionType("reject");
    setShowConfirmModal(true);
  };

  const confirmAction = async () => {
    if (!selectedTransaction || !actionType) return;

    setProcessing(true);
    try {
      if (actionType === "accept") {
        await apiCall.post(
          `/transaction/organizer/accept/${selectedTransaction.id}`
        );
        // Update local state - update status instead of removing
        setTransactions((prevTransactions) => {
          const updatedTransactions = prevTransactions.map((t) =>
            t.id === selectedTransaction.id
              ? { ...t, status: "SUCCESS", is_accepted: true }
              : t
          );
          // Update filtered transactions immediately
          setFilteredTransactions(updatedTransactions);
          return updatedTransactions;
        });
        alert(
          "Transaction accepted successfully! Email notification sent to user."
        );
      } else if (actionType === "reject") {
        if (!rejectionReason.trim()) {
          alert("Please provide a rejection reason");
          return;
        }
        await apiCall.post(
          `/transaction/organizer/reject/${selectedTransaction.id}`,
          {
            rejection_reason: rejectionReason.trim(),
          }
        );
        // Update local state - update status instead of removing
        setTransactions((prevTransactions) => {
          const updatedTransactions = prevTransactions.map((t) =>
            t.id === selectedTransaction.id
              ? { ...t, status: "REJECTED", is_accepted: false }
              : t
          );
          // Update filtered transactions immediately
          setFilteredTransactions(updatedTransactions);
          return updatedTransactions;
        });
        alert(
          "Transaction rejected successfully! Email notification sent to user."
        );
        setRejectionReason("");
      }
    } catch (error) {
      console.error(`Error ${actionType}ing transaction:`, error);
      alert(`Error ${actionType}ing transaction. Please try again.`);
    } finally {
      setProcessing(false);
      setShowConfirmModal(false);
      setSelectedTransaction(null);
      setActionType(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "WAITING_PAYMENT":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "WAITING_CONFIRMATION":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SUCCESS":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
      case "EXPIRED":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "CANCELLED":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })
      .format(amount)
      .replace(/\s/g, "");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading pending transactions...
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
                Pending Approval
              </h1>
              <p className="text-gray-500 text-base">
                Review and approve pending transaction payments
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() =>
                  router.push("/event-organizer/transaction-management")
                }
                className="rounded-full border-2 border-[#09431C] hover:bg-[#c6ee9a] text-[#09431C] hover:text-[#09431C] font-medium"
              >
                Back to Transactions
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Pending Transactions
                  </p>
                  <div className="text-2xl font-bold text-gray-900 break-words">
                    {
                      transactions.filter(
                        (t) => t.status === "WAITING_CONFIRMATION",
                      ).length
                    }
                  </div>
                </div>
                <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                  <Clock className="h-6 w-6 text-[#09431C]" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Awaiting approval
              </p>
            </CardContent>
          </Card>

          <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Total Value
                  </p>
                  <div className="text-2xl font-bold text-gray-900 break-words">
                    {formatCurrency(
                      transactions
                        .filter((t) => t.status === "WAITING_CONFIRMATION")
                        .reduce((sum, t) => sum + t.total_price, 0),
                    )}
                  </div>
                </div>
                <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                  <CreditCard className="h-6 w-6 text-[#09431C]" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3 truncate">
                Pending amount
              </p>
            </CardContent>
          </Card>

          <Card className="h-full bg-white border border-gray-100 rounded-2xl shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-500 mb-1">
                    Filtered Results
                  </p>
                  <div className="text-2xl font-bold text-gray-900 break-words">
                    {filteredTransactions.length}
                  </div>
                </div>
                <div className="p-3 bg-[#c6ee9a]/30 rounded-2xl shrink-0">
                  <Filter className="h-6 w-6 text-[#09431C]" />
                </div>
              </div>
              <p className="text-sm text-gray-500 mt-3">
                Current results
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Filters Section */}
        <Card className="bg-white border border-gray-100 rounded-2xl shadow-md">
          <CardHeader className="pb-2">
            <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
              <Filter className="w-5 h-5 mr-2 text-[#09431C]" />
              Filter & Search Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-4 md:gap-6 w-full">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search by user name, email, or event..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-3 py-2 rounded-full text-sm border-gray-200 focus:border-[#09431C] focus:ring-[#09431C]"
                  />
                </div>
              </div>
              <div className="w-full md:w-48 flex-shrink-0">
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    updateURL(value);
                  }}
                >
                  <SelectTrigger className="w-full py-2 rounded-full text-sm border-gray-200 focus:border-[#09431C] focus:ring-[#09431C]">
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="WAITING_CONFIRMATION">
                      Waiting Confirmation
                    </SelectItem>
                    <SelectItem value="SUCCESS">Success</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Transactions Section */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
              Transaction Requests
            </h2>
          </div>

          {filteredTransactions.length === 0 ? (
            <Card className="bg-white border border-gray-100 rounded-2xl shadow-md">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 bg-[#c6ee9a]/30 rounded-full mb-6">
                  <Clock className="h-16 w-16 text-[#09431C]/50" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                  {transactions.length === 0
                    ? "No pending transactions"
                    : "No transactions match your filters"}
                </h3>
                <p className="text-gray-500 mb-6 text-center text-base max-w-md">
                  {transactions.length === 0
                    ? "All transactions have been processed"
                    : "Try adjusting your search criteria or filters"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-x-auto bg-white border border-gray-100 rounded-2xl shadow-md">
              <CardContent className="p-0">
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
                            {formatCurrency(transaction.total_price)}
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
                            onClick={() => handleViewPaymentProof(transaction)}
                            className="h-8 w-8 rounded-full border border-[#09431C] text-[#09431C] hover:bg-[#c6ee9a] hover:text-[#09431C] transition-colors"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>

                          {transaction.status === "WAITING_CONFIRMATION" && (
                            <>
                              <Button
                                size="icon"
                                title="Accept"
                                onClick={() => handleAcceptTransaction(transaction)}
                                className="h-8 w-8 rounded-full bg-[#8ec357]/20 text-[#09431C] hover:bg-[#8ec357]/40 border border-[#8ec357] transition-colors"
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                title="Reject"
                                onClick={() => handleRejectTransaction(transaction)}
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
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Payment Proof Modal */}
      <Dialog open={showPaymentModal} onOpenChange={setShowPaymentModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Payment Proof</DialogTitle>
            <DialogDescription>
              Payment proof for transaction #{selectedTransaction?.id}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {selectedTransaction?.payment_proof_url && (
              <div className="flex justify-center">
                <img
                  src={selectedTransaction.payment_proof_url}
                  alt="Payment Proof"
                  className="max-w-full h-auto rounded-lg shadow-lg"
                />
              </div>
            )}
            <div className="text-sm text-gray-600">
              <p>
                <strong>User:</strong> {selectedTransaction?.user.username}
              </p>
              <p>
                <strong>Email:</strong> {selectedTransaction?.user.email}
              </p>
              <p>
                <strong>Event:</strong>{" "}
                {selectedTransaction?.tickets[0]?.ticket.event.event_name}
              </p>
              <p>
                <strong>Amount:</strong>{" "}
                {selectedTransaction &&
                  formatCurrency(selectedTransaction.total_price)}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowPaymentModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog open={showConfirmModal} onOpenChange={setShowConfirmModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-yellow-500" />
              Confirm Action
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {actionType} this transaction? An email
              notification will be sent to the user.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <p>
              <strong>Transaction ID:</strong> #{selectedTransaction?.id}
            </p>
            <p>
              <strong>User:</strong> {selectedTransaction?.user.username}
            </p>
            <p>
              <strong>Event:</strong>{" "}
              {selectedTransaction?.tickets[0]?.ticket.event.event_name}
            </p>
            <p>
              <strong>Amount:</strong>{" "}
              {selectedTransaction &&
                formatCurrency(selectedTransaction.total_price)}
            </p>
            {actionType === "reject" && (
              <div className="mt-4">
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
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowConfirmModal(false);
                setRejectionReason("");
              }}
              disabled={processing}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmAction}
              disabled={
                processing ||
                (actionType === "reject" && !rejectionReason.trim())
              }
              className={
                actionType === "accept"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {processing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                <>
                  {actionType === "accept" ? (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {actionType === "accept" ? "Accept" : "Reject"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function PendingApprovalPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#09431C] border-t-transparent mx-auto mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">
              Loading pending transactions...
            </p>
          </div>
        </div>
      }
    >
      <PendingApprovalContent />
    </Suspense>
  );
}
