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
    rollNumber: string;
    department: string;
    year: string;
    hostel: string;
    status: 'Active' | 'Inactive';
    balance: number;
}

interface AddStudentDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    onStudentAdded?: () => void;
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
    const [rollNumber, setRollNumber] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [room, setRoom] = useState("");
    const [plan, setPlan] = useState("Basic Plan");

    useEffect(() => {
        if (studentToEdit) {
            setName(studentToEdit.name);
            setRollNumber(studentToEdit.rollNumber);
            setEmail(studentToEdit.email);
            // @ts-ignore
            setPhone(studentToEdit.phone || "");
            // @ts-ignore
            setRoom(studentToEdit.room || "");
            // @ts-ignore
            setPlan(studentToEdit.currentPlan || "Basic Plan");
        } else {
            // Reset form when not editing
            if (!open) {
                setName("");
                setRollNumber("");
                setEmail("");
                setPhone("");
                setRoom("");
                setPlan("Basic Plan");
            }
        }
    }, [studentToEdit, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const studentData = {
            name,
            rollNumber,
            email,
            phone,
            department: 'Computer Science', // Defaulting for now
            year: 'First', // Defaulting for now
            hostel: 'Boys Hostel 1', // Defaulting for now
            room,
            currentPlan: plan,
            status: 'Active',
            balance: 0
        };

        console.log("Sending student data:", studentData);

        try {
            if (studentToEdit) {
                await api.patch(`/students/${studentToEdit._id}`, studentData);
                toast.success("Student updated successfully!");
            } else {
                await api.post('/students', studentData);
                toast.success("Student added successfully!");
            }
            setOpen?.(false);
            onStudentAdded?.();
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
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{studentToEdit ? "Edit Student" : "Add New Student"}</DialogTitle>
                    <DialogDescription>
                        {studentToEdit ? "Update the student's details here." : "Enter the student's details here."} Click save when you're done.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="name" className="text-right">
                                Name
                            </Label>
                            <Input
                                id="name"
                                name="name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="John Doe"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="roll" className="text-right">
                                Roll No
                            </Label>
                            <Input
                                id="roll"
                                name="roll"
                                value={rollNumber}
                                onChange={(e) => setRollNumber(e.target.value)}
                                placeholder="CS2024001"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="email" className="text-right">
                                Email
                            </Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="john@college.edu"
                                className="col-span-3"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="phone" className="text-right">
                                Phone
                            </Label>
                            <Input
                                id="phone"
                                name="phone"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder="+91 98765 43210"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="room" className="text-right">
                                Room
                            </Label>
                            <Input
                                id="room"
                                name="room"
                                value={room}
                                onChange={(e) => setRoom(e.target.value)}
                                placeholder="A-101"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="plan" className="text-right">
                                Plan
                            </Label>
                            <Select value={plan} onValueChange={setPlan}>
                                <SelectTrigger className="col-span-3">
                                    <SelectValue placeholder="Select a plan" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Basic Plan">Basic Plan</SelectItem>
                                    <SelectItem value="Standard Plan">Standard Plan</SelectItem>
                                    <SelectItem value="Premium Plan">Premium Plan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading ? "Saving..." : (studentToEdit ? "Update Student" : "Save Student")}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
