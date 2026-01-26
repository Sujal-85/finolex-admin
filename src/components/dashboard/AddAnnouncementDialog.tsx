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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState } from "react";
import { toast } from "sonner";
import { Megaphone } from "lucide-react";

interface AddAnnouncementDialogProps {
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export function AddAnnouncementDialog({ open: controlledOpen, onOpenChange: setControlledOpen }: AddAnnouncementDialogProps = {}) {
    const [internalOpen, setInternalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        title: "",
        content: "",
        audience: "all",
        scheduledDate: "",
        pushNotification: false,
    });

    const isControlled = controlledOpen !== undefined;
    const open = isControlled ? controlledOpen : internalOpen;
    const setOpen = isControlled ? setControlledOpen : setInternalOpen;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        // Simulate API call
        setTimeout(() => {
            setIsLoading(false);
            setOpen?.(false);
            toast.success(formData.scheduledDate ? "Announcement scheduled!" : "Announcement published!");
            // Reset form
            setFormData({
                title: "",
                content: "",
                audience: "all",
                scheduledDate: "",
                pushNotification: false,
            });
        }, 1000);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {!isControlled && (
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2 shadow-sm">
                        <Megaphone className="h-4 w-4" /> Create Announcement
                    </Button>
                </DialogTrigger>
            )}
            <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[95vh] flex flex-col p-0 overflow-hidden">
                <DialogHeader className="p-6 pb-2">
                    <DialogTitle>Create New Announcement</DialogTitle>
                    <DialogDescription>
                        Create a new announcement for students.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
                    <div className="flex-1 overflow-y-auto px-6 py-2 space-y-4 custom-scrollbar">
                        <div className="space-y-2">
                            <Label htmlFor="title">Title *</Label>
                            <Input
                                id="title"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Weekend Menu Update"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="content">Content *</Label>
                            <Textarea
                                id="content"
                                value={formData.content}
                                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                placeholder="Write your announcement here..."
                                rows={6}
                                required
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="audience">Target Audience</Label>
                                <Select
                                    value={formData.audience}
                                    onValueChange={(value) =>
                                        setFormData({ ...formData, audience: value })
                                    }
                                >
                                    <SelectTrigger id="audience">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Students</SelectItem>
                                        <SelectItem value="students">Students Only</SelectItem>
                                        <SelectItem value="hostel-a">Block A</SelectItem>
                                        <SelectItem value="hostel-b">Block B</SelectItem>
                                        <SelectItem value="hostel-c">Block C</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="scheduledDate">Schedule (Optional)</Label>
                                <Input
                                    id="scheduledDate"
                                    type="datetime-local"
                                    value={formData.scheduledDate}
                                    onChange={(e) => setFormData({ ...formData, scheduledDate: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <Label htmlFor="pushNotification" className="cursor-pointer">Send Push Notification</Label>
                            <Switch
                                id="pushNotification"
                                checked={formData.pushNotification}
                                onCheckedChange={(checked) =>
                                    setFormData({ ...formData, pushNotification: checked })
                                }
                            />
                        </div>
                    </div>
                    <DialogFooter className="p-6 pt-2 border-t mt-auto">
                        <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                            {isLoading ? "Processing..." : formData.scheduledDate ? "Schedule" : "Publish"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
