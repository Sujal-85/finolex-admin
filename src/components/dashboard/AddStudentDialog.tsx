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
    birthday?: string;
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
    const [birthday, setBirthday] = useState("");
    const [email, setEmail] = useState("");
    const [phone, setPhone] = useState("");
    const [roomNo, setRoomNo] = useState("");
    const [hostelName, setHostelName] = useState("");
    const [plan, setPlan] = useState("Basic Mess Plan");
    const [profileImage, setProfileImage] = useState("");

    useEffect(() => {
        if (studentToEdit) {
            setName(studentToEdit.name);
            // @ts-ignore
            setBirthday(studentToEdit.birthday ? new Date(studentToEdit.birthday).toISOString().split('T')[0] : "");
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
        } else {
            // Reset form when not editing
            if (!open) {
                setName("");
                setBirthday("");
                setEmail("");
                setPhone("");
                setRoomNo("");
                setHostelName("");
                setPlan("Basic Mess Plan");
                setProfileImage("");
            }
        }
    }, [studentToEdit, open]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        const studentData = {
            name,
            birthday,
            email,
            phone,
            year: 'First',
            hostelDetails: {
                hostelName: hostelName || 'Boys Hostel 1',
                roomNo
            },
            currentPlan: plan,
            status: 'Active',
            balance: 0,
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
                            <Label htmlFor="birthday" className="text-right">
                                Birthday
                            </Label>
                            <Input
                                id="birthday"
                                name="birthday"
                                type="date"
                                value={birthday}
                                onChange={(e) => setBirthday(e.target.value)}
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
                                value={roomNo}
                                onChange={(e) => setRoomNo(e.target.value)}
                                placeholder="A-101"
                                className="col-span-3"
                            />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="hostelName" className="text-right">
                                Hostel
                            </Label>
                            <Input
                                id="hostelName"
                                name="hostelName"
                                value={hostelName}
                                onChange={(e) => setHostelName(e.target.value)}
                                placeholder="Boys Hostel 1"
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
                                    <SelectItem value="Basic Mess Plan">Basic Mess Plan</SelectItem>
                                    <SelectItem value="Standard Mess Plan">Standard Mess Plan</SelectItem>
                                    <SelectItem value="Premium Mess Plan">Premium Mess Plan</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="profilePicture" className="text-right">
                                Profile URL
                            </Label>
                            <Input
                                id="profileImage"
                                name="profileImage"
                                value={profileImage}
                                onChange={(e) => setProfileImage(e.target.value)}
                                placeholder="https://example.com/avatar.png"
                                className="col-span-3"
                            />
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
