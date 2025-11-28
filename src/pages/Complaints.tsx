import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Search, Eye, MessageSquare, AlertCircle } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { format } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Complaint {
  id: string;
  studentName: string;
  studentRoll: string;
  category: "food-quality" | "service" | "hygiene" | "other";
  priority: "low" | "medium" | "high";
  subject: string;
  description: string;
  status: "open" | "in-progress" | "resolved";
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  internalNotes: string[];
}

const mockComplaints: Complaint[] = [
  {
    id: "C001",
    studentName: "Rahul Sharma",
    studentRoll: "CS001",
    category: "food-quality",
    priority: "high",
    subject: "Food served cold",
    description: "The food served in dinner was cold and not properly heated.",
    status: "open",
    createdAt: "2024-01-15T18:30:00",
    internalNotes: [],
  },
  {
    id: "C002",
    studentName: "Priya Patel",
    studentRoll: "EC002",
    category: "hygiene",
    priority: "high",
    subject: "Cleanliness issue in dining hall",
    description: "Tables were not cleaned properly during lunch time.",
    status: "in-progress",
    assignedTo: "Staff - Cleaning Team",
    createdAt: "2024-01-14T13:15:00",
    internalNotes: ["Cleaning team has been notified"],
  },
  {
    id: "C003",
    studentName: "Amit Kumar",
    studentRoll: "ME003",
    category: "service",
    priority: "medium",
    subject: "Long waiting time",
    description: "Had to wait 30+ minutes in queue during breakfast.",
    status: "resolved",
    assignedTo: "Staff - Service Manager",
    createdAt: "2024-01-13T08:00:00",
    resolvedAt: "2024-01-14T10:00:00",
    internalNotes: ["Additional counter opened during peak hours", "Issue resolved"],
  },
];

export default function Complaints() {
  const [complaints, setComplaints] = useState<Complaint[]>(mockComplaints);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [assignTo, setAssignTo] = useState("");

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = c.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.studentRoll.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         c.subject.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    const matchesTab = activeTab === "all" || c.status === activeTab;
    
    return matchesSearch && matchesCategory && matchesPriority && matchesTab;
  });

  const stats = {
    open: complaints.filter(c => c.status === "open").length,
    inProgress: complaints.filter(c => c.status === "in-progress").length,
    resolved: complaints.filter(c => c.status === "resolved").length,
    avgResolutionTime: "2.5 days",
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAssignTo(complaint.assignedTo || "");
    setShowDetailModal(true);
  };

  const handleStatusChange = (status: Complaint["status"]) => {
    if (selectedComplaint) {
      setComplaints(complaints.map(c =>
        c.id === selectedComplaint.id
          ? { 
              ...c, 
              status,
              resolvedAt: status === "resolved" ? new Date().toISOString() : c.resolvedAt
            }
          : c
      ));
      setSelectedComplaint({ ...selectedComplaint, status });
      toast({
        title: "Status Updated",
        description: `Complaint marked as ${status.replace("-", " ")}.`,
      });
    }
  };

  const handleAssign = () => {
    if (selectedComplaint && assignTo) {
      setComplaints(complaints.map(c =>
        c.id === selectedComplaint.id ? { ...c, assignedTo: assignTo } : c
      ));
      setSelectedComplaint({ ...selectedComplaint, assignedTo: assignTo });
      toast({
        title: "Complaint Assigned",
        description: `Assigned to ${assignTo}.`,
      });
    }
  };

  const handleAddNote = () => {
    if (selectedComplaint && noteText.trim()) {
      const updatedNotes = [...selectedComplaint.internalNotes, noteText];
      setComplaints(complaints.map(c =>
        c.id === selectedComplaint.id ? { ...c, internalNotes: updatedNotes } : c
      ));
      setSelectedComplaint({ ...selectedComplaint, internalNotes: updatedNotes });
      setNoteText("");
      toast({ title: "Note Added", description: "Internal note added successfully." });
    }
  };

  const getPriorityBadge = (priority: Complaint["priority"]) => {
    const variants = {
      low: { variant: "secondary" as const, label: "Low" },
      medium: { variant: "outline" as const, label: "Medium" },
      high: { variant: "destructive" as const, label: "High" },
    };
    const { variant, label } = variants[priority];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: Complaint["status"]) => {
    const variants = {
      open: { variant: "destructive" as const, label: "Open" },
      "in-progress": { variant: "outline" as const, label: "In Progress" },
      resolved: { variant: "default" as const, label: "Resolved" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getCategoryLabel = (category: Complaint["category"]) => {
    const labels = {
      "food-quality": "Food Quality",
      service: "Service",
      hygiene: "Hygiene",
      other: "Other",
    };
    return labels[category];
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complaints & Feedback</h1>
          <p className="text-muted-foreground">Handle student complaints and feedback</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Open</p>
              <p className="text-3xl font-bold text-destructive">{stats.open}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">In Progress</p>
              <p className="text-3xl font-bold text-warning">{stats.inProgress}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Resolved</p>
              <p className="text-3xl font-bold text-success">{stats.resolved}</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Avg Resolution</p>
              <p className="text-3xl font-bold">{stats.avgResolutionTime}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs and Filters */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="open">Open</TabsTrigger>
              <TabsTrigger value="in-progress">In Progress</TabsTrigger>
              <TabsTrigger value="resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap gap-4 mt-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="food-quality">Food Quality</SelectItem>
                <SelectItem value="service">Service</SelectItem>
                <SelectItem value="hygiene">Hygiene</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <div className="space-y-3">
        {filteredComplaints.map((complaint) => (
          <Card key={complaint.id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(complaint)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{complaint.subject}</CardTitle>
                    {getPriorityBadge(complaint.priority)}
                    {getStatusBadge(complaint.status)}
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarFallback className="text-xs">
                          {complaint.studentName.split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {complaint.studentName} ({complaint.studentRoll})
                    </span>
                    <span>•</span>
                    <span>{getCategoryLabel(complaint.category)}</span>
                    <span>•</span>
                    <span>{format(new Date(complaint.createdAt), "MMM dd, yyyy")}</span>
                  </CardDescription>
                </div>
                <Button variant="ghost" size="sm">
                  <Eye className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description}</p>
              {complaint.assignedTo && (
                <p className="text-xs text-muted-foreground mt-2">
                  Assigned to: {complaint.assignedTo}
                </p>
              )}
            </CardContent>
          </Card>
        ))}

        {filteredComplaints.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No complaints found.</p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Detail Modal */}
      <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedComplaint?.subject}
              {selectedComplaint && getPriorityBadge(selectedComplaint.priority)}
            </DialogTitle>
            <DialogDescription>
              Complaint ID: {selectedComplaint?.id}
            </DialogDescription>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-6 py-4">
              {/* Student Info */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Student Details</Label>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar>
                    <AvatarFallback>
                      {selectedComplaint.studentName.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedComplaint.studentName}</p>
                    <p className="text-sm text-muted-foreground">Roll: {selectedComplaint.studentRoll}</p>
                  </div>
                </div>
              </div>

              {/* Complaint Details */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Description</Label>
                <p className="text-sm">{selectedComplaint.description}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Category</Label>
                  <p className="text-sm">{getCategoryLabel(selectedComplaint.category)}</p>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Status</Label>
                  <div>{getStatusBadge(selectedComplaint.status)}</div>
                </div>
                <div className="space-y-2">
                  <Label className="text-muted-foreground">Created</Label>
                  <p className="text-sm">{format(new Date(selectedComplaint.createdAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
                </div>
                {selectedComplaint.resolvedAt && (
                  <div className="space-y-2">
                    <Label className="text-muted-foreground">Resolved</Label>
                    <p className="text-sm">{format(new Date(selectedComplaint.resolvedAt), "MMM dd, yyyy 'at' hh:mm a")}</p>
                  </div>
                )}
              </div>

              {/* Assignment */}
              <div className="space-y-2">
                <Label htmlFor="assign">Assign To</Label>
                <div className="flex gap-2">
                  <Select value={assignTo} onValueChange={setAssignTo}>
                    <SelectTrigger id="assign">
                      <SelectValue placeholder="Select staff member" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Staff - Service Manager">Service Manager</SelectItem>
                      <SelectItem value="Staff - Cleaning Team">Cleaning Team</SelectItem>
                      <SelectItem value="Staff - Kitchen Manager">Kitchen Manager</SelectItem>
                      <SelectItem value="Staff - Maintenance">Maintenance</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button onClick={handleAssign} disabled={!assignTo}>
                    Assign
                  </Button>
                </div>
              </div>

              {/* Status Update */}
              <div className="space-y-2">
                <Label>Update Status</Label>
                <div className="flex gap-2">
                  <Button
                    variant={selectedComplaint.status === "open" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("open")}
                  >
                    Open
                  </Button>
                  <Button
                    variant={selectedComplaint.status === "in-progress" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("in-progress")}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={selectedComplaint.status === "resolved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("resolved")}
                  >
                    Resolved
                  </Button>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <div className="space-y-2">
                  {selectedComplaint.internalNotes.map((note, idx) => (
                    <div key={idx} className="p-3 bg-muted rounded-lg text-sm">
                      <MessageSquare className="h-3 w-3 inline mr-2" />
                      {note}
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Textarea
                      placeholder="Add internal note..."
                      value={noteText}
                      onChange={(e) => setNoteText(e.target.value)}
                      rows={2}
                    />
                    <Button onClick={handleAddNote} disabled={!noteText.trim()}>
                      Add Note
                    </Button>
                  </div>
                </div>
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
