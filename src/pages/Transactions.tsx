import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import { Search, Download, Send, Check, X, Eye, Copy, Filter, Receipt, ExternalLink } from "lucide-react";
import { StatsCard } from "@/components/shared/StatsCard";
import { format } from "date-fns";
import api from "@/api/client";
import { Loader } from "@/components/ui/loader";

interface Transaction {
    _id: string;
    studentName: string;
    studentId: {
        _id: string;
        rollNumber: string;
        hostel: string;
    } | null;
    amount: number;
    type: string;
    method: string; // UPI, Card, Cash, QR Code
    date: string;
    status: "Completed" | "Pending" | "Failed";
    transactionId?: string;
    receiptUrl?: string;
}

export default function Transactions() {
    const [searchParams] = useSearchParams();
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
    const [statusFilter, setStatusFilter] = useState("all");
    const [methodFilter, setMethodFilter] = useState("all");
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    useEffect(() => {
        const query = searchParams.get("search");
        if (query) {
            setSearchTerm(query);
        }
    }, [searchParams]);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions');
            console.log('Fetched transactions:', response.data);
            console.log('First transaction receiptUrl:', response.data[0]?.receiptUrl);
            setTransactions(response.data);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to fetch transactions",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    const totalTransactions = transactions.length;
    const qrTransactions = transactions.filter(t => t.method === "QR Code").length;
    const totalVolume = transactions.reduce((sum, t) => sum + t.amount, 0);

    const filteredTransactions = transactions.filter(t => {
        const matchesSearch = (t.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.studentId?.rollNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t._id || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
            (t.transactionId || "").toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || t.status === statusFilter;
        const matchesMethod = methodFilter === "all" || t.method === methodFilter;

        return matchesSearch && matchesStatus && matchesMethod;
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
            await Promise.all(selectedIds.map(id => api.patch(`/transactions/${id}`, { status: 'Completed' })));

            setTransactions(transactions.map(t =>
                selectedIds.includes(t._id) ? { ...t, status: "Completed" as const } : t
            ));
            toast({
                title: "Status Updated",
                description: `${selectedIds.length} transaction(s) marked as completed.`,
            });
            setSelectedIds([]);
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to update transaction status",
                variant: "destructive",
            });
        }
    };

    const handleApprove = async (id: string, e?: React.MouseEvent) => {
        if (e) e.stopPropagation();
        try {
            await api.patch(`/transactions/${id}`, { status: 'Completed' });
            setTransactions(transactions.map(t =>
                t._id === id ? { ...t, status: "Completed" as const } : t
            ));
            toast({
                title: "Approved",
                description: "Transaction approved and payment recorded.",
            });
        } catch (error: any) {
            console.error("Approval failed:", error);
            toast({
                title: "Approval Failed",
                description: error.response?.data?.message || error.message || "Failed to sync payment record",
                variant: "destructive",
            });
        }
    };

    const [isGenerating, setIsGenerating] = useState(false);
    const [emailAddress, setEmailAddress] = useState("");
    const [generatedUrl, setGeneratedUrl] = useState<string | null>(null);

    const handleGenerateReceipt = async () => {
        if (!selectedTransaction) return;
        setIsGenerating(true);
        try {
            // Call Backend to generate PDF
            const response = await api.post('/receipts/generate', {
                transaction: selectedTransaction,
                studentId: selectedTransaction.studentId?._id
            });

            const url = response.data.url;
            setGeneratedUrl(url);

            toast({
                title: "Receipt Generated",
                description: "Receipt is ready to share or download.",
            });
            return url;
        } catch (error) {
            console.error('Receipt Generation Failed:', error);
            toast({
                title: "Generation Failed",
                description: "Could not generate receipt PDF.",
                variant: "destructive",
            });
            return null;
        } finally {
            setIsGenerating(false);
        }
    };

    const handleDownloadReceipt = async () => {
        let url = generatedUrl;
        if (!url) {
            url = await handleGenerateReceipt();
        }
        if (url) window.open(url, '_blank');
    };

    const handleShareWhatsApp = async () => {
        let url = generatedUrl;
        if (!url) {
            url = await handleGenerateReceipt();
        }
        if (url) {
            const message = `*PAYMENT RECEIPT*\n\n*Amount:* ₹${selectedTransaction?.amount}\n*Student:* ${selectedTransaction?.studentName}\n*Date:* ${format(new Date(selectedTransaction?.date || Date.now()), "dd MMM yyyy")}\n\n*Link:* ${url}\n\n_Generated by Finolex Canteen Admin_`;
            const whatsappUrl = `https://web.whatsapp.com/send?text=${encodeURIComponent(message)}`;
            window.open(whatsappUrl, '_blank');
        }
    };

    const handleSendEmail = async () => {
        if (!emailAddress) {
            toast({ title: "Email Required", description: "Please enter the student's email.", variant: "destructive" });
            return;
        }

        let url = generatedUrl;
        if (!url) {
            url = await handleGenerateReceipt();
        }

        if (url) {
            try {
                await api.post('/receipts/email', {
                    email: emailAddress,
                    url: url,
                    subject: `Payment Receipt - ${selectedTransaction?.transactionId || 'Finolex Canteen'}`
                });
                toast({ title: "Email Sent", description: `Receipt sent to ${emailAddress}` });
            } catch (error) {
                toast({ title: "Email Failed", description: "Could not send email.", variant: "destructive" });
            }
        }
    };

    // Auto-fill email from student data if available
    useEffect(() => {
        if (selectedTransaction && selectedTransaction.receiptUrl) {
            // Maybe fetch student email if not in transaction object
        }
    }, [selectedTransaction]);

    const getStatusBadge = (status: Transaction["status"]) => {
        const variants: Record<Transaction["status"], { variant: "default" | "secondary" | "destructive" | "outline", label: string }> = {
            Completed: { variant: "default", label: "Completed" },
            Pending: { variant: "secondary", label: "Pending" },
            Failed: { variant: "destructive", label: "Failed" },
        };
        const { variant, label } = variants[status] || variants.Pending;
        return <Badge variant={variant}>{label}</Badge>;
    };

    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Transactions Log</h1>
                    <p className="text-muted-foreground">View and audit all system transactions</p>
                </div>
            </div>

            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                <StatsCard
                    title="Total Transactions"
                    value={totalTransactions.toString()}
                    change="All time"
                    changeType="neutral"
                />
                <StatsCard
                    title="QR Code Volume"
                    value={qrTransactions.toString()}
                    change={`Total ${qrTransactions}`}
                    changeType="positive"
                />
                <StatsCard
                    title="Total Volume"
                    value={`₹${totalVolume.toLocaleString()}`}
                    change="All methods"
                    changeType="neutral"
                />
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Transaction History</CardTitle>
                    <CardDescription>Comprehensive log of all payments</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search tx id, student, roll no..."
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

                        <Select value={methodFilter} onValueChange={setMethodFilter}>
                            <SelectTrigger className="w-[150px]">
                                <SelectValue placeholder="Method" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Methods</SelectItem>
                                <SelectItem value="QR Code">QR Code</SelectItem>
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
                            </div>
                        </div>
                    )}

                    <div className="border rounded-lg max-h-[calc(100vh-300px)] overflow-auto custom-scrollbar">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-12">
                                        <Checkbox
                                            checked={selectedIds.length === filteredTransactions.length && filteredTransactions.length > 0}
                                            onCheckedChange={handleSelectAll}
                                        />
                                    </TableHead>
                                    <TableHead>Ref ID</TableHead>
                                    <TableHead>Student</TableHead>
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
                                        <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                                            {isLoading ? "Loading..." : "No transactions found."}
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    filteredTransactions.map((t) => (
                                        <TableRow key={t._id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedIds.includes(t._id)}
                                                    onCheckedChange={(checked) => handleSelectOne(t._id, checked as boolean)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-mono text-xs">{t._id.slice(-8)}...</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{t.studentName}</span>
                                                    <span className="text-xs text-muted-foreground">{t.studentId?.rollNumber}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>₹{t.amount}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline">{t.method}</Badge>
                                            </TableCell>
                                            <TableCell>{format(new Date(t.date), "MMM dd HH:mm")}</TableCell>
                                            <TableCell>{getStatusBadge(t.status)}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedTransaction(t);
                                                        setGeneratedUrl(null); // Reset URL on new view
                                                        setShowReceiptModal(true);
                                                    }}
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    View
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

            <Dialog open={showReceiptModal} onOpenChange={setShowReceiptModal}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                        <DialogDescription>Manage transaction and generate receipts</DialogDescription>
                    </DialogHeader>
                    {selectedTransaction && (
                        <div className="space-y-4 py-4">

                            {/* Actions Grid */}
                            {/* <div className="grid grid-cols-2 gap-3">
                                <Button variant="outline" onClick={handleDownloadReceipt} disabled={isGenerating}>
                                    <Download className="h-4 w-4 mr-2" />
                                    {isGenerating ? 'Generating...' : 'Download PDF'}
                                </Button>
                                <Button variant="outline" className="text-green-600 border-green-200 hover:bg-green-50" onClick={handleShareWhatsApp} disabled={isGenerating}>
                                    <Send className="h-4 w-4 mr-2" />
                                    Share WhatsApp
                                </Button>
                            </div> */}

                            {/* <div className="flex gap-2">
                                <Input
                                    placeholder="Enter email to share..."
                                    value={emailAddress}
                                    onChange={(e) => setEmailAddress(e.target.value)}
                                />
                                <Button onClick={handleSendEmail} disabled={isGenerating}>Send</Button>
                            </div> */}

                            {/* Existing Screenshot View */}
                            {selectedTransaction.receiptUrl && (
                                <div className="bg-muted/30 border rounded-lg p-4 flex items-center justify-between">
                                    <div className="space-y-1">
                                        <span className="text-sm font-semibold block">User Uploaded Screenshot</span>
                                    </div>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => window.open(selectedTransaction.receiptUrl, '_blank')}
                                    >
                                        <ExternalLink className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}

                            {/* Details Table */}
                            <div className="border rounded-lg p-4 space-y-3 bg-muted/20 text-sm">
                                <div className="flex justify-between">
                                    <span className="font-medium">Student:</span>
                                    <span>{selectedTransaction.studentName}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Amount:</span>
                                    <span className="font-bold text-green-600">₹{selectedTransaction.amount}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Date:</span>
                                    <span>{format(new Date(selectedTransaction.date), "dd MMM yyyy, HH:mm")}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="font-medium">Ref ID:</span>
                                    <span className="font-mono text-xs">{selectedTransaction._id}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowReceiptModal(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div >
    );
}
