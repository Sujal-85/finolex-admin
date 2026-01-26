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
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";

import api from "@/api/client";

interface Student {
    _id: string;
    name: string;
    email: string;
    dob?: string;
    year: string;
    hostelDetails: {
        hostelName: string;
        roomNo: string;
    };
    status: 'Active' | 'Inactive';
    balance: number;
    profileImage?: string;
}

interface AddStudentDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onStudentAdded?: (student?: any) => void;
    studentToEdit?: Student | null;
}

export function AddStudentDialog({ open: controlledOpen, onOpenChange: setControlledOpen, onStudentAdded, studentToEdit }: AddStudentDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    // Form state
    const [name, setName] = useState("");
    const [dob, setDob] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [roomNo, setRoomNo] = useState("");
    const [hostelName, setHostelName] = useState("");
    const [plan, setPlan] = useState("Basic Mess Plan");
    const [profileImage, setProfileImage] = useState("");
    const [balance, setBalance] = useState("0");

    useEffect(() => {
        if (studentToEdit) {
            setName(studentToEdit.name);
            // @ts-ignore
            setDob(studentToEdit.dob ? new Date(studentToEdit.dob).toISOString().split('T')[0] : "");
            setEmail(studentToEdit.email);
            // @ts-ignore
            setPhone(studentToEdit.phone || "");
            // @ts-ignore
            setRoomNo(studentToEdit.hostelDetails?.roomNo || "");
            // @ts-ignore
            setHostelName(studentToEdit.hostelDetails?.hostelName || "");
            // @ts-ignore
            setPlan(studentToEdit.currentPlan || "Basic Mess Plan");
            setProfileImage(studentToEdit.profileImage || "");
            setBalance(studentToEdit.balance?.toString() || "0");
        } else {
            // Reset form when not editing
            if (!open) {
                setName("");
                setDob("");
                setEmail("");
                setPhone("");
                setRoomNo("");
                setHostelName("");
                setPlan("Basic Mess Plan");
                setProfileImage("");
                setBalance("0");
            }
        }
    }, [studentToEdit, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const studentData = {
            name,
            dob,
            email,
            phone,
            year: 'First',
            hostelDetails: {
                hostelName: hostelName || 'Boys Hostel 1',
                roomNo
            },
            currentPlan: plan,
            status: 'Active',
            balance: parseFloat(balance) || 0,
            profileImage
        };

        console.log("Sending student data:", studentData);

        try {
            if (studentToEdit) {
                await api.patch(`/students/${studentToEdit._id}`, studentData);
                toast.success("Student updated successfully!");
                onStudentAdded?.();
            } else {
                const response = await api.post('/students', studentData);
                toast.success("Student added successfully!");
                onStudentAdded?.(response.data);
            }
            setOpen?.(false);
        } catch (error: any) {
            console.error("Failed to save student", error);
            const errorMessage = error.response?.data?.message ||
                error.response?.data?.errmsg ||
                error.response?.data?.error ||
                "Failed to save student";
            toast.error(errorMessage);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button className="gap-2 shadow-sm">
                        <Plus className="h-4 w-4" /> Add Student
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[500px] w-[95vw] max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>{studentToEdit ? "Edit Student" : "Add New Student"}</DialogTitle>
                    <DialogDescription>
                        {studentToEdit ? "Update the student's details here." : "Enter the student's details here."} Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 custom-scrollbar">
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2">
                            <Label htmlFor="name" className="sm:text-right pt-2 sm:pt-0">
                                Name *
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="sm:col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2">
                            <Label htmlFor="dob" className="sm:text-right pt-2 sm:pt-0">
                                Date of Birth *
                            </Label>
                            <Input
                                id="dob"
                                name="dob"
                                type="date"
                                value={dob}
                                onChange={(e) => setDob(e.target.value)}
                                className="sm:col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2">
                            <Label htmlFor="email" className="sm:text-right pt-2 sm:pt-0">
                                Email *
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@college.edu"
                                className="sm:col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-4 items-start sm:items-center gap-2">
                            <Label htmlFor="phone" className="sm:text-right pt-2 sm:pt-0">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="sm:col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="hostelName">Hostel</Label>
                                <Input
                                    id="hostelName"
                                    name="hostelName"
                                    value={hostelName}
                                    onChange={(e) => setHostelName(e.target.value)}
                                    placeholder="Boys Hostel 1"
                                />
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <Label htmlFor="room">Room</Label>
                                <Input
                                    id="room"
                                    name="room"
                                    value={roomNo}
                                    onChange={(e) => setRoomNo(e.target.value)}
                                    placeholder="A-101"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="plan">Mess Plan</Label>
                            <Select value={plan} onValueChange={setPlan}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Basic Mess Plan">Basic Mess Plan</SelectItem>
                                    <SelectItem value="Standard Mess Plan">Standard Mess Plan</SelectItem>
                                    <SelectItem value="Premium Mess Plan">Premium Mess Plan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="balance">Initial Balance (₹)</Label>
                            <Input
                                id="balance"
                                name="balance"
                                type="number"
                                value={balance}
                                onChange={(e) => setBalance(e.target.value)}
                                placeholder="0"
                            />
                        </div>
                        <div className="grid grid-cols-1 gap-2">
                            <Label htmlFor="profileImage">Profile Image URL</Label>
                            <Input
                                id="profileImage"
                                name="profileImage"
                                value={profileImage}
                                onChange={(e) => setProfileImage(e.target.value)}
                                placeholder="https://example.com/avatar.png"
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2 border-t mt-auto">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                            {isLoading ? "Saving..." : (studentToEdit ? "Update Student" : "Save Student")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
