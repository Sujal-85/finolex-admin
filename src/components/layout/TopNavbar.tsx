import { Bell, Search, Plus, ChevronDown, RefreshCw, MoreVertical, LogOut, User, Settings as SettingsIcon } from "lucide-react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import api from "@/api/client";
import { formatDistanceToNow } from "date-fns";
import { AddStudentDialog } from "@/components/dashboard/AddStudentDialog";
import { AddPaymentDialog } from "@/components/dashboard/AddPaymentDialog";
import { AddAnnouncementDialog } from "@/components/dashboard/AddAnnouncementDialog";
import { useQueryClient } from "@tanstack/react-query";

export function TopNavbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchCategory, setSearchCategory] = useState("students");
  const [activeDialog, setActiveDialog] = useState<"student" | "payment" | "announcement" | null>(null);

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      navigate(`/${searchCategory}?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleLogout = () => {
    toast.success("Logged out successfully");
    navigate("/login");
  };


  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const lastNotificationIdRef = useRef<string | null>(null);
  const isFirstLoad = useRef(true);

  useEffect(() => {
    fetchNotifications();
    // Poll for notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/notifications');
      const newNotifications = response.data;

      if (newNotifications.length > 0) {
        const latestId = newNotifications[0]._id;

        // If not first load and we have a new latest ID
        if (!isFirstLoad.current && lastNotificationIdRef.current && lastNotificationIdRef.current !== latestId) {
          // Find all new notifications
          const newItems = [];
          for (const n of newNotifications) {
            if (n._id === lastNotificationIdRef.current) break;
            newItems.push(n);
          }

          // Show toast for new items (limit to 3 to avoid spam)
          newItems.slice(0, 3).forEach(n => {
            toast.info(n.message, {
              description: n.title,
              action: {
                label: "Mark Read",
                onClick: () => handleNotificationClick(n)
              }
            });
          });
        }

        lastNotificationIdRef.current = latestId;
      }

      isFirstLoad.current = false;
      setNotifications(newNotifications);
      setUnreadCount(newNotifications.filter((n: any) => !n.isRead).length);
    } catch (error) {
      console.error("Failed to fetch notifications", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.patch('/notifications/read-all');
      toast.success("All notifications marked as read");
      fetchNotifications();
    } catch (error) {
      toast.error("Failed to mark notifications as read");
    }
  };

  const handleNotificationClick = async (notification: any) => {
    if (!notification.isRead) {
      try {
        await api.patch(`/notifications/${notification._id}/read`);
        fetchNotifications();
      } catch (error) {
        console.error("Failed to mark notification as read", error);
      }
    }
    toast.info(notification.message);
  };

  const [user, setUser] = useState({
    name: 'Admin',
    avatar: '',
    email: ''
  });

  useEffect(() => {
    // Initial load
    loadUser();

    // Listen for storage changes (cross-tab)
    window.addEventListener('storage', loadUser);

    // Listen for custom event (same tab updates)
    window.addEventListener('userUpdated', loadUser);

    return () => {
      window.removeEventListener('storage', loadUser);
      window.removeEventListener('userUpdated', loadUser);
    };
  }, []);

  const loadUser = () => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser({
          name: parsed.name || 'Admin',
          avatar: parsed.avatar || '',
          email: parsed.email || ''
        });
      } catch (e) {
        console.error("Failed to parse user data", e);
      }
    }
  };

  const NotificationBell = () => (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <Badge className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">
              {unreadCount}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          Notifications
          <Button variant="ghost" size="sm" className="h-auto p-0 text-xs font-normal text-muted-foreground" onClick={markAllAsRead}>
            Mark all as read
          </Button>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length > 0 ? (
            notifications.map((notification) => (
              <DropdownMenuItem
                key={notification._id}
                className={`flex flex-col items-start gap-1 py-3 cursor-pointer ${!notification.isRead ? 'bg-muted/50' : ''}`}
                onClick={() => handleNotificationClick(notification)}
              >
                <span className="font-medium">{notification.title}</span>
                <span className="text-xs text-muted-foreground">
                  {notification.message} - {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
                </span>
              </DropdownMenuItem>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No notifications
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  return (
    <header className="sticky top-0 z-10 flex h-16 items-center justify-between border-b bg-card px-4 md:px-6 shadow-sm">
      <div className="flex flex-1 items-center gap-4 md:gap-4 md:flex-none">
        <SidebarTrigger />
        <div className="relative flex-1 md:w-full md:max-w-2xl md:flex-none flex gap-2">
          <Select value={searchCategory} onValueChange={setSearchCategory}>
            <SelectTrigger className="w-[80px] md:w-[140px] h-9">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="students">Students</SelectItem>
              <SelectItem value="payments">Payments</SelectItem>
              <SelectItem value="transactions">Transactions</SelectItem>
              <SelectItem value="complaints">Complaints</SelectItem>
              <SelectItem value="feedback">Feedback</SelectItem>
              <SelectItem value="announcements">Announcements</SelectItem>
            </SelectContent>
          </Select>
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={`Search ${searchCategory}...`}
              className="pl-9 w-full h-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearch}
            />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* Mobile Menu */}
        <div className="md:hidden flex items-center gap-2">
          <NotificationBell />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={async () => {
                setIsRefreshing(true);
                await queryClient.invalidateQueries();
                setTimeout(() => setIsRefreshing(false), 1000);
                toast.success("Data refreshed");
              }}>
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Data
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Quick Add</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setActiveDialog("student")}>Add Student</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog("payment")}>Record Payment</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setActiveDialog("announcement")}>Create Announcement</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/profile")}>
                <User className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Desktop Actions */}
        <div className="hidden md:flex items-center gap-2">
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

          <Button
            variant="ghost"
            size="icon"
            onClick={async () => {
              setIsRefreshing(true);
              await queryClient.invalidateQueries();
              setTimeout(() => setIsRefreshing(false), 1000);
              toast.success("Data refreshed");
            }}
            className={isRefreshing ? "animate-spin" : ""}
            disabled={isRefreshing}
          >
            <RefreshCw className="h-5 w-5" />
          </Button>

          <NotificationBell />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="gap-2">
                <Avatar className="h-8 w-8">
                  <AvatarImage src={user.avatar} />
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {user.name.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name}</span>
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

        {/* Dialogs - Kept at root level to work with both menus */}
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
      </div>
    </header>
  );
}
