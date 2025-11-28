import { Bell, Search, Plus, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { AddStudentDialog } from "@/components/dashboard/AddStudentDialog";
import { AddPaymentDialog } from "@/components/dashboard/AddPaymentDialog";
import { AddAnnouncementDialog } from "@/components/dashboard/AddAnnouncementDialog";

export function TopNavbar() {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeDialog, setActiveDialog] = useState<"student" | "payment" | "announcement" | null>(null);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      toast.info(`Searching for: ${searchQuery}`);
      // In a real app, this would trigger a search or navigate to a search results page
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const handleNotificationClick = (message: string) => {
    toast.info(message);
  };

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <SidebarTrigger />
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search students, transactions, plans..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearch}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <Plus className="h-4 w-4" />
              Quick Add
              <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => setActiveDialog("student")}>
              Add Student
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveDialog("payment")}>
              Record Payment
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setActiveDialog("announcement")}>
              Create Announcement
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/menu")}>
              Add Menu Item
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AddStudentDialog
          open={activeDialog === "student"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
        />
        <AddPaymentDialog
          open={activeDialog === "payment"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
        />
        <AddAnnouncementDialog
          open={activeDialog === "announcement"}
          onOpenChange={(open) => !open && setActiveDialog(null)}
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs">
                3
              </Badge>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              Notifications
              <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-normal text-muted-foreground" onClick={() => toast.success("All notifications marked as read")}>
                Mark all as read
              </Button>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer" onClick={() => handleNotificationClick("Viewing payment details")}>
              <span className="font-medium">New payment received</span>
              <span className="text-xs text-muted-foreground">
                ₹5000 from John Doe - 2 minutes ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer" onClick={() => handleNotificationClick("Viewing complaint details")}>
              <span className="font-medium">High priority complaint</span>
              <span className="text-xs text-muted-foreground">
                Food quality issue - Block A - 15 minutes ago
              </span>
            </DropdownMenuItem>
            <DropdownMenuItem className="flex flex-col items-start gap-1 py-3 cursor-pointer" onClick={() => handleNotificationClick("Viewing menu schedule")}>
              <span className="font-medium">Menu published</span>
              <span className="text-xs text-muted-foreground">
                Weekly menu for next week - 1 hour ago
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="gap-2">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground">
                  AD
                </AvatarFallback>
              </Avatar>
              <span className="text-sm">Admin</span>
              <ChevronDown className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate("/profile")}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate("/settings")}>
              Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-danger" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
