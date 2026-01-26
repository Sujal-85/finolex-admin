import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { CreditCard } from "lucide-react";
import api from "@/api/client";

interface Student {
    _id: string;
    name: string;
    rollNumber: string;
}

interface AddPaymentDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onPaymentAdded?: () => void;
}

export function AddPaymentDialog({ open: controlledOpen, onOpenChange: setControlledOpen, onPaymentAdded }: AddPaymentDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);

    // Form State
    const [studentId, setStudentId] = useState("");
    const [amount, setAmount] = useState("");
    const [type, setType] = useState("Meal Plan");
    const [method, setMethod] = useState("Cash");
    const [transactionId, setTransactionId] = useState("");
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [remarks, setRemarks] = useState("");

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    useEffect(() => {
        if (open) {
            fetchStudents();
            // Reset form on open
            setStudentId("");
            setAmount("");
            setType("Meal Plan");
            setMethod("Cash");
            setTransactionId("");
            setDate(new Date().toISOString().split('T')[0]);
            setRemarks("");
        }
    }, [open]);

    const fetchStudents = async () => {
        try {
            const response = await api.get('/students');
            setStudents(response.data);
        } catch (error) {
            console.error("Failed to fetch students", error);
            toast.error("Failed to load students list");
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        if (!studentId || !amount || !type || !method || !date) {
            toast.error("Please fill in all required fields");
            setIsLoading(false);
            return;
        }

        if (method !== 'Cash' && !transactionId) {
            toast.error("Transaction ID is required for online payments");
            setIsLoading(false);
            return;
        }

        const selectedStudent = students.find(s => s._id === studentId);
        if (!selectedStudent) {
            toast.error("Invalid student selected");
            setIsLoading(false);
            return;
        }

        try {
            const payload = {
                studentId,
                studentName: selectedStudent.name,
                amount: Number(amount),
                type,
                method,
                transactionId: method === 'Cash' ? undefined : transactionId,
                date: new Date(date),
                remarks,
                status: 'Completed'
            };

            await api.post('/payments', payload);
            toast.success("Payment recorded successfully!");
            setOpen?.(false);
            if (onPaymentAdded) {
                onPaymentAdded();
            }
        } catch (error: any) {
            console.error("Failed to record payment", error);
            toast.error(error.response?.data?.message || "Failed to record payment");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <CreditCard className="h-4 w-4" /> Add Payment
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Record Payment</DialogTitle>
                    <DialogDescription>
                        Record a new payment transaction for a student.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 custom-scrollbar">
                        <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="student">Student *</Label>
                            <Select value={studentId} onValueChange={setStudentId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select student" />
                                </SelectTrigger>
                                <SelectContent>
                                    {students.map((student) => (
                                        <SelectItem key={student._id} value={student._id}>
                                            {student.name} ({student.rollNumber})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="amount">Amount (₹) *</Label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2.5 text-muted-foreground">₹</span>
                                    <Input
                                        id="amount"
                                        type="number"
                                        value={amount}
                                        onChange={(e) => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="pl-7"
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="date">Date *</Label>
                                <Input
                                    id="date"
                                    type="date"
                                    value={date}
                                    onChange={(e) => setDate(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="type">Payment Type *</Label>
                                <Select value={type} onValueChange={setType}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Meal Plan">Meal Plan</SelectItem>
                                        <SelectItem value="Top-up">Top-up</SelectItem>
                                        <SelectItem value="Fine">Fine</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="method">Method *</Label>
                                <Select value={method} onValueChange={setMethod}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select method" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Cash">Cash</SelectItem>
                                        <SelectItem value="UPI">UPI</SelectItem>
                                        <SelectItem value="Card">Card</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        {method !== 'Cash' && (
                            <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="transactionId">Transaction ID *</Label>
                                <Input
                                    id="transactionId"
                                    value={transactionId}
                                    onChange={(e) => setTransactionId(e.target.value)}
                                    placeholder="Enter transaction ID"
                                    required={method !== 'Cash'}
                                />
                            </div>
                        )}

                        <div className="grid grid-cols-1 gap-2 pb-2">
                            <Label htmlFor="remarks">Remarks</Label>
                            <Textarea
                                id="remarks"
                                value={remarks}
                                onChange={(e) => setRemarks(e.target.value)}
                                placeholder="Optional remarks..."
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2 border-t mt-auto">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                            {isLoading ? "Recording..." : "Record Payment"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
