import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, Download, Eye } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: "students" | "payments" | "plans" | "menu" | "announcements" | "complaints" | "settings";
  details: string;
  ipAddress: string;
  status: "success" | "failed";
}

const mockLogs: ActivityLog[] = [
  {
    id: "1",
    timestamp: "2024-01-15T10:30:25",
    user: "Admin",
    action: "Updated Student Record",
    module: "students",
    details: "Modified details for student CS001",
    ipAddress: "192.168.1.100",
    status: "success",
  },
  {
    id: "2",
    timestamp: "2024-01-15T10:15:10",
    user: "Admin",
    action: "Created Announcement",
    module: "announcements",
    details: "Published 'Weekend Menu Update' announcement",
    ipAddress: "192.168.1.100",
    status: "success",
  },
  {
    id: "3",
    timestamp: "2024-01-15T09:45:33",
    user: "Admin",
    action: "Marked Payment as Paid",
    module: "payments",
    details: "Transaction TX002 status changed to paid",
    ipAddress: "192.168.1.100",
    status: "success",
  },
  {
    id: "4",
    timestamp: "2024-01-15T09:30:18",
    user: "Admin",
    action: "Updated Mess Plan",
    module: "plans",
    details: "Modified pricing for Standard Mess Plan",
    ipAddress: "192.168.1.100",
    status: "success",
  },
  {
    id: "5",
    timestamp: "2024-01-15T09:12:55",
    user: "Admin",
    action: "Added Menu Item",
    module: "menu",
    details: "Added 'Paneer Butter Masala' to Monday lunch",
    ipAddress: "192.168.1.100",
    status: "success",
  },
  {
    id: "6",
    timestamp: "2024-01-14T18:22:40",
    user: "Admin",
    action: "Resolved Complaint",
    module: "complaints",
    details: "Marked complaint C003 as resolved",
    ipAddress: "192.168.1.100",
    status: "success",
  },
  {
    id: "7",
    timestamp: "2024-01-14T16:45:12",
    user: "Admin",
    action: "Failed Login Attempt",
    module: "settings",
    details: "Invalid credentials provided",
    ipAddress: "203.0.113.45",
    status: "failed",
  },
];

export default function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>(mockLogs);
  const [searchTerm, setSearchTerm] = useState("");
  const [moduleFilter, setModuleFilter] = useState("all");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  const filteredLogs = logs.filter(log => {
    const matchesSearch = log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesModule = moduleFilter === "all" || log.module === moduleFilter;
    const matchesAction = actionFilter === "all" || log.action.includes(actionFilter);

    return matchesSearch && matchesModule && matchesAction;
  });

  const handleExport = () => {
    const csv = [
      ["Timestamp", "User", "Action", "Module", "Details", "IP Address", "Status"],
      ...filteredLogs.map(log => [
        format(new Date(log.timestamp), "yyyy-MM-dd HH:mm:ss"),
        log.user,
        log.action,
        log.module,
        log.details,
        log.ipAddress,
        log.status,
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `activity-log-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();

    toast({
      title: "Export Successful",
      description: "Activity log exported to CSV.",
    });
  };

  const handleViewDetails = (log: ActivityLog) => {
    setSelectedLog(log);
    setShowDetailModal(true);
  };

  const getModuleBadge = (module: ActivityLog["module"]) => {
    const colors: Record<ActivityLog["module"], string> = {
      students: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      payments: "bg-green-500/10 text-green-500 border-green-500/20",
      plans: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      menu: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      announcements: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      complaints: "bg-red-500/10 text-red-500 border-red-500/20",
      settings: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };

    return (
      <Badge variant="outline" className={colors[module]}>
        {module.charAt(0).toUpperCase() + module.slice(1)}
      </Badge>
    );
  };

  const getStatusBadge = (status: ActivityLog["status"]) => {
    return status === "success" ? (
      <Badge variant="default">Success</Badge>
    ) : (
      <Badge variant="destructive">Failed</Badge>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Activity Log</h1>
          <p className="text-muted-foreground">View system activity and audit trail</p>
        </div>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Activity History</CardTitle>
          <CardDescription>Filter and search system activities</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 w-full">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <Select value={moduleFilter} onValueChange={setModuleFilter}>
                <SelectTrigger className="flex-1 md:w-[150px]">
                  <SelectValue placeholder="Module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modules</SelectItem>
                  <SelectItem value="students">Students</SelectItem>
                  <SelectItem value="payments">Payments</SelectItem>
                  <SelectItem value="plans">Plans</SelectItem>
                  <SelectItem value="menu">Menu</SelectItem>
                  <SelectItem value="announcements">Announcements</SelectItem>
                  <SelectItem value="complaints">Complaints</SelectItem>
                  <SelectItem value="settings">Settings</SelectItem>
                </SelectContent>
              </Select>

              <Select value={actionFilter} onValueChange={setActionFilter}>
                <SelectTrigger className="flex-1 md:w-[150px]">
                  <SelectValue placeholder="Action" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Actions</SelectItem>
                  <SelectItem value="Created">Created</SelectItem>
                  <SelectItem value="Updated">Updated</SelectItem>
                  <SelectItem value="Deleted">Deleted</SelectItem>
                  <SelectItem value="Login">Login</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline" onClick={handleExport} className="w-full md:w-auto">
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            </div>
          </div>

          {/* Table */}
          <div className="border rounded-lg max-h-[calc(100vh-350px)] overflow-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead className="hidden md:table-cell">User</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Module</TableHead>
                  <TableHead className="hidden md:table-cell">IP Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="font-mono text-xs whitespace-nowrap">
                      {format(new Date(log.timestamp), "MMM dd, HH:mm")}
                    </TableCell>
                    <TableCell className="font-medium hidden md:table-cell">{log.user}</TableCell>
                    <TableCell className="min-w-[120px]">{log.action}</TableCell>
                    <TableCell>{getModuleBadge(log.module)}</TableCell>
                    <TableCell className="font-mono text-xs hidden md:table-cell">{log.ipAddress}</TableCell>
                    <TableCell>{getStatusBadge(log.status)}</TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleViewDetails(log)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No activity logs found matching your filters.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Activity Details</DialogTitle>
            <DialogDescription>Complete information about this activity</DialogDescription>
          </DialogHeader>
          {selectedLog && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Timestamp</p>
                  <p className="text-sm mt-1 font-mono">
                    {format(new Date(selectedLog.timestamp), "MMM dd, yyyy 'at' HH:mm:ss")}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">User</p>
                  <p className="text-sm mt-1">{selectedLog.user}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Action</p>
                  <p className="text-sm mt-1">{selectedLog.action}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Module</p>
                  <p className="text-sm mt-1">{getModuleBadge(selectedLog.module)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">IP Address</p>
                  <p className="text-sm mt-1 font-mono">{selectedLog.ipAddress}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Status</p>
                  <p className="text-sm mt-1">{getStatusBadge(selectedLog.status)}</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Details</p>
                <p className="text-sm mt-1">{selectedLog.details}</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowDetailModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
