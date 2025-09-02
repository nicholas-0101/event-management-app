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
import { useRouter } from "next/navigation";
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
        event_start_date: string;
      };
    };
  }>;
}

export default function PendingApprovalPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    Transaction[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("WAITING_CONFIRMATION");
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

  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  useEffect(() => {
    filterTransactions();
  }, [transactions, searchTerm, statusFilter]);

  const fetchPendingTransactions = async () => {
    try {
      const response = await apiCall.get("/transaction/organizer");
      const allTransactions = response.data.transactions || [];
      // Filter only pending transactions (WAITING_CONFIRMATION)
      const pendingTransactions = allTransactions.filter(
        (transaction: Transaction) =>
          transaction.status === "WAITING_CONFIRMATION"
      );
      setTransactions(pendingTransactions);
    } catch (error) {
      console.error("Error fetching pending transactions:", error);
    } finally {
      setLoading(false);
    }
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
        // Update local state - remove from pending list
        setTransactions(
          transactions.filter((t) => t.id !== selectedTransaction.id)
        );
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
        // Update local state - remove from pending list
        setTransactions(
          transactions.filter((t) => t.id !== selectedTransaction.id)
        );
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
      case "WAITING_CONFIRMATION":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "SUCCESS":
        return "bg-green-100 text-green-800 border-green-200";
      case "REJECTED":
        return "bg-red-100 text-red-800 border-red-200";
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
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-[#00481a] border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">
            Loading pending transactions...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <EOSidebar />

      <div className="flex justify-center">
        <div className="w-full max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-gray-200/50 rounded-lg mt-8 mb-8">
            <div className="px-6 py-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-3xl md:text-4xl font-bold text-[#09431C]">
                    Pending Approval
                  </h1>
                  <p className="text-gray-600 text-lg">
                    Review and approve pending transaction payments
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() =>
                      router.push("/event-organizer/transaction-management")
                    }
                    className="border-2 border-[#00481a] hover:border-[#97d753] hover:bg-[#c6ee9a] text-[#00481a] hover:text-[#00481a] font-medium"
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
              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Pending Transactions
                  </CardTitle>
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-5 w-5 text-yellow-600" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {
                      transactions.filter(
                        (t) => t.status === "WAITING_CONFIRMATION"
                      ).length
                    }
                  </div>
                  <p className="text-sm text-gray-600">Awaiting approval</p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Total Value
                  </CardTitle>
                  <div className="p-2 bg-[#97d753] rounded-lg">
                    <CreditCard className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      transactions
                        .filter((t) => t.status === "WAITING_CONFIRMATION")
                        .reduce((sum, t) => sum + t.total_price, 0)
                    )}
                  </div>
                  <p className="text-sm text-gray-600">Pending amount</p>
                </CardContent>
              </Card>

              <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                  <CardTitle className="text-sm font-medium text-gray-700">
                    Filtered Results
                  </CardTitle>
                  <div className="p-2 bg-[#c6ee9a] rounded-lg">
                    <Filter className="h-5 w-5 text-[#00481a]" />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-gray-900">
                    {filteredTransactions.length}
                  </div>
                  <p className="text-sm text-gray-600">Current results</p>
                </CardContent>
              </Card>
            </div>

            {/* Filters Section */}
            <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center">
                  <Filter className="w-5 h-5 mr-2 text-[#00481a]" />
                  Filter & Search Transactions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      placeholder="Search by user name, email, or event..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-12 py-3 border-gray-200 focus:border-[#00481a] focus:ring-[#00481a] text-lg"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="py-3 border-gray-200 focus:border-[#00481a] focus:ring-[#00481a] text-lg">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="WAITING_CONFIRMATION">
                        Waiting Confirmation
                      </SelectItem>
                      <SelectItem value="SUCCESS">Success</SelectItem>
                      <SelectItem value="REJECTED">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
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
                <Card className="bg-white/70 backdrop-blur-sm border-0 shadow-xl">
                  <CardContent className="flex flex-col items-center justify-center py-16">
                    <div className="p-4 bg-gray-100 rounded-full mb-6">
                      <Clock className="h-16 w-16 text-gray-400" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-900 mb-3 text-center">
                      {transactions.length === 0
                        ? "No pending transactions"
                        : "No transactions match your filters"}
                    </h3>
                    <p className="text-gray-600 mb-6 text-center text-lg max-w-md">
                      {transactions.length === 0
                        ? "All transactions have been processed"
                        : "Try adjusting your search criteria or filters"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredTransactions.map((transaction) => (
                    <Card
                      key={transaction.id}
                      className="bg-white/80 backdrop-blur-sm border-0 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                    >
                      <CardHeader className="pb-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2">
                            <CardTitle className="text-lg font-bold text-gray-900">
                              {transaction.tickets[0]?.ticket.event.event_name}
                            </CardTitle>
                            <div className="flex items-center text-sm text-gray-600">
                              <User className="w-4 h-4 mr-2" />
                              {transaction.user.username}
                            </div>
                            <div className="flex items-center text-sm text-gray-600">
                              <Mail className="w-4 h-4 mr-2" />
                              {transaction.user.email}
                            </div>
                          </div>
                          <Badge className={getStatusColor(transaction.status)}>
                            {transaction.status}
                          </Badge>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center text-sm text-gray-700">
                            <Calendar className="w-4 h-4 mr-3 text-blue-600" />
                            <span className="font-medium">
                              {format(
                                new Date(
                                  transaction.tickets[0]?.ticket.event.event_start_date
                                ),
                                "PPP",
                                { locale: id }
                              )}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-700">
                            <MapPin className="w-4 h-4 mr-3 text-red-600" />
                            <span className="font-medium">
                              {
                                transaction.tickets[0]?.ticket.event
                                  .event_location
                              }
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-700">
                            <CreditCard className="w-4 h-4 mr-3 text-green-600" />
                            <span className="font-bold text-lg text-[#00481a]">
                              {formatCurrency(transaction.total_price)}
                            </span>
                          </div>

                          <div className="flex items-center text-sm text-gray-700">
                            <Clock className="w-4 h-4 mr-3 text-gray-600" />
                            <span className="font-medium">
                              Requested:{" "}
                              {format(
                                new Date(transaction.transaction_date_time),
                                "PPP 'at' p",
                                { locale: id }
                              )}
                            </span>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex space-x-2 pt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleViewPaymentProof(transaction)}
                            className="flex-1 border-2 border-blue-300 hover:border-blue-500 hover:bg-blue-50 text-blue-700 hover:text-blue-800 font-medium"
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View Proof
                          </Button>

                          {transaction.status === "WAITING_CONFIRMATION" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleAcceptTransaction(transaction)
                                }
                                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium"
                              >
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept
                              </Button>
                              <Button
                                size="sm"
                                onClick={() =>
                                  handleRejectTransaction(transaction)
                                }
                                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-medium"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
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
