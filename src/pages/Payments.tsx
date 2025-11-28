import { useState, useEffect } from "react";
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Search, Download, Send, Check, X, Eye, Copy, Filter } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { format } from "date-fns";
import api from "@/api/client";

import { AddPaymentDialog } from "@/components/dashboard/AddPaymentDialog";

interface Transaction {
  _id: string;
  studentName: string;
  studentId: {
    _id: string;
    rollNumber: string;
    hostel: string;
    department: string;
  } | null;
  amount: number;
  type: string;
  method: string; // UPI, Card, Cash
  date: string;
  status: "Completed" | "Pending" | "Failed";
  transactionId?: string;
}

export default function Payments() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const response = await api.get('/payments');
      setTransactions(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch payments",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate summary stats
  const totalCollected = transactions.filter(t => t.status === "Completed").reduce((sum, t) => sum + t.amount, 0);
  const totalPending = transactions.filter(t => t.status === "Pending").reduce((sum, t) => sum + t.amount, 0);
  const totalFailed = transactions.filter(t => t.status === "Failed").reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.studentId?.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      t._id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesHostel = hostelFilter === "all" || (t.studentId?.hostel || "") === hostelFilter;
    const matchesPaymentMode = paymentModeFilter === "all" || t.method === paymentModeFilter;

    return matchesSearch && matchesStatus && matchesHostel && matchesPaymentMode;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTransactions.map(t => t._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds([...selectedIds, id]);
    } else {
      setSelectedIds(selectedIds.filter(sid => sid !== id));
    }
  };

  const handleMarkAsPaid = async () => {
    try {
      await Promise.all(selectedIds.map(id => api.patch(`/payments/${id}`, { status: 'Completed' })));

      setTransactions(transactions.map(t =>
        selectedIds.includes(t._id) ? { ...t, status: "Completed" as const } : t
      ));
      toast({
        title: "Payment Updated",
        description: `${selectedIds.length} transaction(s) marked as completed.`,
      });
      setSelectedIds([]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update payment status",
        variant: "destructive",
      });
    }
  };

  const handleSendReminder = () => {
    toast({
      title: "Reminder Sent",
      description: `Payment reminder sent to ${selectedIds.length} student(s).`,
    });
    setShowReminderModal(false);
    setSelectedIds([]);
  };

  const generateReceipt = () => {
    if (!selectedTransaction) return;

    const doc = new jsPDF();

    // Header
    doc.setFontSize(20);
    doc.text("Finolex Canteen Receipt", 105, 15, { align: "center" });

    doc.setFontSize(12);
    doc.text(`Receipt ID: ${selectedTransaction._id}`, 14, 30);
    doc.text(`Date: ${format(new Date(selectedTransaction.date), "MMM dd, yyyy")}`, 14, 38);

    // Table
    autoTable(doc, {
      startY: 45,
      head: [['Field', 'Value']],
      body: [
        ['Student Name', selectedTransaction.studentName],
        ['Roll Number', selectedTransaction.studentId?.rollNumber || "N/A"],
        ['Payment Method', selectedTransaction.method],
        ['Transaction ID', selectedTransaction.transactionId || "N/A"],
        ['Amount', `Rs. ${selectedTransaction.amount}`],
        ['Status', selectedTransaction.status],
      ],
    });

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 150;
    doc.text("Thank you for your payment!", 105, finalY + 20, { align: "center" });

    doc.save(`Receipt-${selectedTransaction._id}.pdf`);
    toast({ title: "Receipt Downloaded", description: "Receipt PDF downloaded successfully." });
    setShowReceiptModal(false);
  };

  const handleExport = () => {
    const csv = [
      ["TX ID", "Student", "Roll No", "Amount", "Method", "Date", "Status", "Hostel", "Department"],
      ...filteredTransactions.map(t => [
        t._id, t.studentName, t.studentId?.rollNumber || "N/A", t.amount, t.method, t.date, t.status, t.studentId?.hostel || "N/A", t.studentId?.department || "N/A"
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Transactions exported to CSV.",
    });
  };

  const handleCopyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast({
      title: "Copied",
      description: "Transaction ID copied to clipboard.",
    });
  };

  const getStatusBadge = (status: Transaction["status"]) => {
    const variants: Record<Transaction["status"], { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
      Completed: { variant: "default", label: "Completed" },
      Pending: { variant: "secondary", label: "Pending" },
      Failed: { variant: "destructive", label: "Failed" },
    };

    const { variant, label } = variants[status] || variants.Pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Transactions</h1>
          <p className="text-muted-foreground">Manage payments and transaction records</p>
        </div>
        <AddPaymentDialog onPaymentAdded={fetchPayments} />
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <StatsCard
          title="Total Collected"
          value={`₹${totalCollected.toLocaleString()}`}
          icon={Check}
          change="+12% from last month"
          changeType="positive"
        />
        <StatsCard
          title="Pending Payments"
          value={`₹${totalPending.toLocaleString()}`}
          icon={Filter}
          change="+5% from last month"
          changeType="negative"
        />
        <StatsCard
          title="Failed Payments"
          value={`₹${totalFailed.toLocaleString()}`}
          icon={X}
          change="+8% from last month"
          changeType="negative"
        />
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
          <CardDescription>Filter and manage payment transactions</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filter Row */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name, roll no, or TX ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Pending">Pending</SelectItem>
                <SelectItem value="Failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={hostelFilter} onValueChange={setHostelFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Hostel" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Hostels</SelectItem>
                <SelectItem value="Block A">Block A</SelectItem>
                <SelectItem value="Block B">Block B</SelectItem>
                <SelectItem value="Block C">Block C</SelectItem>
              </SelectContent>
            </Select>

            <Select value={paymentModeFilter} onValueChange={setPaymentModeFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Payment Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Modes</SelectItem>
                <SelectItem value="UPI">UPI</SelectItem>
                <SelectItem value="Card">Card</SelectItem>
                <SelectItem value="Cash">Cash</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
              <span className="text-sm font-medium">{selectedIds.length} selected</span>
              <div className="flex gap-2 ml-auto">
                <Button size="sm" onClick={handleMarkAsPaid}>
                  <Check className="h-4 w-4 mr-2" />
                  Mark as Completed
                </Button>
                <Button size="sm" variant="outline" onClick={() => setShowReminderModal(true)}>
                  <Send className="h-4 w-4 mr-2" />
                  Send Reminder
                </Button>
              </div>
            </div>
          )}

          {/* Export Button */}
          <div className="flex justify-end">
            <Button variant="outline" onClick={handleExport}>
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>

          {/* Table */}
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>TX ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Method</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-12 text-muted-foreground">
                      {isLoading ? "Loading transactions..." : "No transactions found matching your filters."}
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTransactions.map((transaction) => (
                    <TableRow key={transaction._id}>
                      <TableCell>
                        <Checkbox
                          checked={selectedIds.includes(transaction._id)}
                          onCheckedChange={(checked) => handleSelectOne(transaction._id, checked as boolean)}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm">{transaction._id.slice(-6).toUpperCase()}</span>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={() => handleCopyId(transaction._id)}
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{transaction.studentName}</TableCell>
                      <TableCell>{transaction.studentId?.rollNumber || "N/A"}</TableCell>
                      <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                      <TableCell>{transaction.method}</TableCell>
                      <TableCell>{format(new Date(transaction.date), "MMM dd, yyyy")}</TableCell>
                      <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedTransaction(transaction);
                            setShowReceiptModal(true);
                          }}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Receipt Modal */}
      <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Receipt</DialogTitle>
            <DialogDescription>Transaction details and receipt</DialogDescription>
          </DialogHeader>
          {selectedTransaction && (
            <div className="space-y-4 py-4">
              <div className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center pb-3 border-b">
                  <span className="font-semibold text-lg">Receipt</span>
                  <span className="font-mono text-sm text-muted-foreground">{selectedTransaction._id}</span>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium">{selectedTransaction.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roll No:</span>
                    <span className="font-medium">{selectedTransaction.studentId?.rollNumber || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(new Date(selectedTransaction.date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <span className="font-medium">{selectedTransaction.method}</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-bold text-lg">₹{selectedTransaction.amount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Status:</span>
                    {getStatusBadge(selectedTransaction.status)}
                  </div>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReceiptModal(false)}>
              Close
            </Button>
            <Button onClick={generateReceipt}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reminder Modal */}
      <Dialog open={showReminderModal} onOpenChange={setShowReminderModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Payment Reminder</DialogTitle>
            <DialogDescription>
              Send payment reminder to {selectedIds.length} student(s)
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground">
              A payment reminder will be sent via email and SMS to the selected students.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowReminderModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSendReminder}>
              <Send className="h-4 w-4 mr-2" />
              Send Reminder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
