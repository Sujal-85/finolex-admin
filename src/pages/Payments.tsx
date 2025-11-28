import { useState } from "react";
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

interface Transaction {
  id: string;
  studentName: string;
  rollNo: string;
  amount: number;
  paymentMode: string;
  date: string;
  status: "paid" | "pending" | "overdue" | "failed";
  hostel: string;
  department: string;
}

// Mock data
const mockTransactions: Transaction[] = [
  { id: "TX001", studentName: "Rahul Sharma", rollNo: "CS001", amount: 5000, paymentMode: "UPI", date: "2024-01-15", status: "paid", hostel: "Block A", department: "CSE" },
  { id: "TX002", studentName: "Priya Patel", rollNo: "EC002", amount: 5000, paymentMode: "Card", date: "2024-01-14", status: "paid", hostel: "Block B", department: "ECE" },
  { id: "TX003", studentName: "Amit Kumar", rollNo: "ME003", amount: 5000, paymentMode: "Cash", date: "2024-01-10", status: "pending", hostel: "Block C", department: "MECH" },
  { id: "TX004", studentName: "Sneha Reddy", rollNo: "CS004", amount: 5000, paymentMode: "UPI", date: "2024-01-05", status: "overdue", hostel: "Block A", department: "CSE" },
  { id: "TX005", studentName: "Vikram Singh", rollNo: "EE005", amount: 5000, paymentMode: "Card", date: "2024-01-12", status: "paid", hostel: "Block B", department: "EEE" },
  { id: "TX006", studentName: "Anjali Gupta", rollNo: "CS006", amount: 5000, paymentMode: "UPI", date: "2024-01-08", status: "failed", hostel: "Block A", department: "CSE" },
];

export default function Payments() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockTransactions);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [hostelFilter, setHostelFilter] = useState("all");
  const [paymentModeFilter, setPaymentModeFilter] = useState("all");
  const [showReceiptModal, setShowReceiptModal] = useState(false);
  const [showReminderModal, setShowReminderModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);

  // Calculate summary stats
  const totalCollected = transactions.filter(t => t.status === "paid").reduce((sum, t) => sum + t.amount, 0);
  const totalPending = transactions.filter(t => t.status === "pending").reduce((sum, t) => sum + t.amount, 0);
  const totalOverdue = transactions.filter(t => t.status === "overdue").reduce((sum, t) => sum + t.amount, 0);

  // Filter transactions
  const filteredTransactions = transactions.filter(t => {
    const matchesSearch = t.studentName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         t.rollNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         t.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || t.status === statusFilter;
    const matchesHostel = hostelFilter === "all" || t.hostel === hostelFilter;
    const matchesPaymentMode = paymentModeFilter === "all" || t.paymentMode === paymentModeFilter;
    
    return matchesSearch && matchesStatus && matchesHostel && matchesPaymentMode;
  });

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(filteredTransactions.map(t => t.id));
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

  const handleMarkAsPaid = () => {
    setTransactions(transactions.map(t => 
      selectedIds.includes(t.id) ? { ...t, status: "paid" as const } : t
    ));
    toast({
      title: "Payment Updated",
      description: `${selectedIds.length} transaction(s) marked as paid.`,
    });
    setSelectedIds([]);
  };

  const handleSendReminder = () => {
    toast({
      title: "Reminder Sent",
      description: `Payment reminder sent to ${selectedIds.length} student(s).`,
    });
    setShowReminderModal(false);
    setSelectedIds([]);
  };

  const handleExport = () => {
    const csv = [
      ["TX ID", "Student", "Roll No", "Amount", "Payment Mode", "Date", "Status", "Hostel", "Department"],
      ...filteredTransactions.map(t => [
        t.id, t.studentName, t.rollNo, t.amount, t.paymentMode, t.date, t.status, t.hostel, t.department
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
      paid: { variant: "default", label: "Paid" },
      pending: { variant: "secondary", label: "Pending" },
      overdue: { variant: "destructive", label: "Overdue" },
      failed: { variant: "outline", label: "Failed" },
    };
    
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Payments & Transactions</h1>
          <p className="text-muted-foreground">Manage payments and transaction records</p>
        </div>
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
          title="Overdue Payments"
          value={`₹${totalOverdue.toLocaleString()}`}
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
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="overdue">Overdue</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
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
                  Mark as Paid
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
                      checked={selectedIds.length === filteredTransactions.length}
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>TX ID</TableHead>
                  <TableHead>Student</TableHead>
                  <TableHead>Roll No</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment Mode</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(transaction.id)}
                        onCheckedChange={(checked) => handleSelectOne(transaction.id, checked as boolean)}
                      />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm">{transaction.id}</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={() => handleCopyId(transaction.id)}
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">{transaction.studentName}</TableCell>
                    <TableCell>{transaction.rollNo}</TableCell>
                    <TableCell>₹{transaction.amount.toLocaleString()}</TableCell>
                    <TableCell>{transaction.paymentMode}</TableCell>
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
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTransactions.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No transactions found matching your filters.
            </div>
          )}
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
                  <span className="font-mono text-sm text-muted-foreground">{selectedTransaction.id}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Student:</span>
                    <span className="font-medium">{selectedTransaction.studentName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Roll No:</span>
                    <span className="font-medium">{selectedTransaction.rollNo}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Date:</span>
                    <span className="font-medium">{format(new Date(selectedTransaction.date), "MMM dd, yyyy")}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Mode:</span>
                    <span className="font-medium">{selectedTransaction.paymentMode}</span>
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
            <Button onClick={() => {
              toast({ title: "Receipt Downloaded", description: "Receipt PDF downloaded successfully." });
              setShowReceiptModal(false);
            }}>
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
