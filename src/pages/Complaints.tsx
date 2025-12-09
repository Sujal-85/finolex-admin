import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
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
import api from "@/api/client";
import { Loader } from "@/components/ui/loader";

interface Complaint {
  _id: string;
  studentName: string;
  studentId: string; // Assuming studentId is populated or we fetch student details
  category: "food-quality" | "service" | "hygiene" | "other";
  priority: "Low" | "Medium" | "High";
  subject: string;
  description: string;
  status: "Pending" | "In Progress" | "Resolved";
  assignedTo?: string;
  createdAt: string;
  resolvedAt?: string;
  internalNotes: string[];
  studentProfilePicture?: string;
  studentRollNumber?: string;
  studentHostel?: string;

  studentRoom?: string;
  image?: string;
}

export default function Complaints() {
  const [searchParams] = useSearchParams();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [selectedComplaint, setSelectedComplaint] = useState<Complaint | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("all");
  const [noteText, setNoteText] = useState("");
  const [assignTo, setAssignTo] = useState("");
  const [isLoading, setIsLoading] = useState(true); // Add isLoading state

  useEffect(() => {
    fetchComplaints();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchComplaints, 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const query = searchParams.get("search");
    if (query) {
      setSearchTerm(query);
    }
  }, [searchParams]);

  const fetchComplaints = async () => {
    try {
      const response = await api.get('/complaints');
      setComplaints(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };



  if (isLoading) {
    return <Loader />;
  }

  const filteredComplaints = complaints.filter(c => {
    const matchesSearch = (c.studentName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.subject || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === "all" || c.category === categoryFilter;
    const matchesPriority = priorityFilter === "all" || c.priority === priorityFilter;
    const matchesTab = activeTab === "all" || (c.status && c.status.toLowerCase() === activeTab.toLowerCase());

    return matchesSearch && matchesCategory && matchesPriority && matchesTab;
  });

  const stats = {
    open: complaints.filter(c => c.status && c.status.toLowerCase() === "pending").length,
    inProgress: complaints.filter(c => c.status && c.status.toLowerCase() === "in progress").length,
    resolved: complaints.filter(c => c.status && c.status.toLowerCase() === "resolved").length,
    avgResolutionTime: "2.5 days", // This would ideally be calculated from data
  };

  const handleViewDetails = (complaint: Complaint) => {
    setSelectedComplaint(complaint);
    setAssignTo(complaint.assignedTo || "");
    setShowDetailModal(true);
  };

  const handleStatusChange = async (status: Complaint["status"]) => {
    if (selectedComplaint) {
      try {
        const updatedData = {
          status,
          resolvedAt: status === "Resolved" ? new Date().toISOString() : null
        };
        await api.patch(`/complaints/${selectedComplaint._id}`, updatedData);

        setComplaints(complaints.map(c =>
          c._id === selectedComplaint._id ? { ...c, ...updatedData } : c
        ));
        setSelectedComplaint({ ...selectedComplaint, ...updatedData });

        // Refresh to ensure all stats are updated
        fetchComplaints();

        toast({
          title: "Status Updated",
          description: `Complaint marked as ${status}.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update status",
          variant: "destructive",
        });
      }
    }
  };

  const handleAssign = async () => {
    if (selectedComplaint && assignTo) {
      try {
        await api.patch(`/complaints/${selectedComplaint._id}`, { assignedTo: assignTo });

        setComplaints(complaints.map(c =>
          c._id === selectedComplaint._id ? { ...c, assignedTo: assignTo } : c
        ));
        setSelectedComplaint({ ...selectedComplaint, assignedTo: assignTo });

        toast({
          title: "Complaint Assigned",
          description: `Assigned to ${assignTo}.`,
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to assign complaint",
          variant: "destructive",
        });
      }
    }
  };

  const handleAddNote = async () => {
    if (selectedComplaint && noteText.trim()) {
      try {
        const updatedNotes = [...(selectedComplaint.internalNotes || []), noteText];
        await api.patch(`/complaints/${selectedComplaint._id}`, { internalNotes: updatedNotes });

        setComplaints(complaints.map(c =>
          c._id === selectedComplaint._id ? { ...c, internalNotes: updatedNotes } : c
        ));
        setSelectedComplaint({ ...selectedComplaint, internalNotes: updatedNotes });
        setNoteText("");

        toast({ title: "Note Added", description: "Internal note added successfully." });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to add note",
          variant: "destructive",
        });
      }
    }
  };

  const getPriorityBadge = (priority: Complaint["priority"]) => {
    const variants = {
      Low: { variant: "secondary" as const, label: "Low" },
      Medium: { variant: "outline" as const, label: "Medium" },
      High: { variant: "destructive" as const, label: "High" },
    };
    const { variant, label } = variants[priority] || variants.Medium;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getStatusBadge = (status: Complaint["status"]) => {
    const variants = {
      Pending: { variant: "destructive" as const, label: "Pending" },
      "In Progress": { variant: "outline" as const, label: "In Progress" },
      Resolved: { variant: "default" as const, label: "Resolved" },
    };
    const { variant, label } = variants[status] || variants.Pending;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getCategoryLabel = (category: Complaint["category"]) => {
    const labels = {
      "food-quality": "Food Quality",
      service: "Service",
      hygiene: "Hygiene",
      other: "Other",
    };
    return labels[category] || category;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Complaints</h1>
          <p className="text-muted-foreground">Handle student complaints</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pending</p>
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
              <TabsTrigger value="Pending">Pending</TabsTrigger>
              <TabsTrigger value="In Progress">In Progress</TabsTrigger>
              <TabsTrigger value="Resolved">Resolved</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-2 md:flex md:flex-row gap-4 mt-4">
            <div className="col-span-2 md:flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search complaints..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-full"
                />
              </div>
            </div>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-[150px]">
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
              <SelectTrigger className="w-full md:w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priorities</SelectItem>
                <SelectItem value="High">High</SelectItem>
                <SelectItem value="Medium">Medium</SelectItem>
                <SelectItem value="Low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Complaints List */}
      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 scrollbar-hide" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
        <style>
          {`
            .scrollbar-hide::-webkit-scrollbar {
                display: none;
            }
          `}
        </style>
        {filteredComplaints.map((complaint) => (
          <Card key={complaint._id} className="hover:bg-muted/50 transition-colors cursor-pointer" onClick={() => handleViewDetails(complaint)}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">{complaint.subject || "No Subject"}</CardTitle>
                    {getPriorityBadge(complaint.priority)}
                    {getStatusBadge(complaint.status)}
                  </div>
                  <CardDescription className="flex items-center gap-4">
                    <span className="flex items-center gap-1">
                      <Avatar className="h-5 w-5">
                        <AvatarImage src={complaint.studentProfilePicture} alt={complaint.studentName} />
                        <AvatarFallback className="text-xs">
                          {(complaint.studentName || "U").split(" ").map(n => n[0]).join("")}
                        </AvatarFallback>
                      </Avatar>
                      {complaint.studentName || "Unknown Student"}
                    </span>
                    <span>•</span>
                    <span>{getCategoryLabel(complaint.category || "other")}</span>
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
              <p className="text-sm text-muted-foreground line-clamp-2">{complaint.description || "No description available."}</p>
              {complaint.image && (
                <div className="mt-3">
                  <img
                    src={complaint.image}
                    alt="Complaint attachment"
                    className="rounded-md max-h-48 object-cover w-full"
                  />
                </div>
              )}
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
              {selectedComplaint?.subject || "No Subject"}
              {selectedComplaint && getPriorityBadge(selectedComplaint.priority)}
            </DialogTitle>
            <DialogDescription>
              Complaint ID: {selectedComplaint?._id}
            </DialogDescription>
          </DialogHeader>

          {selectedComplaint && (
            <div className="space-y-6 py-4">
              {/* Student Info */}
              <div className="space-y-2">
                <Label className="text-muted-foreground">Student Details</Label>
                <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <Avatar>
                    <AvatarImage src={selectedComplaint.studentProfilePicture} alt={selectedComplaint.studentName} />
                    <AvatarFallback>
                      {(selectedComplaint.studentName || "U").split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{selectedComplaint.studentName || "Unknown Student"}</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedComplaint.studentRollNumber && <span>{selectedComplaint.studentRollNumber} • </span>}
                      {selectedComplaint.studentHostel}
                      {selectedComplaint.studentRoom && <span> • Room {selectedComplaint.studentRoom}</span>}
                    </p>
                  </div>
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
                    variant={selectedComplaint.status === "Pending" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("Pending")}
                  >
                    Pending
                  </Button>
                  <Button
                    variant={selectedComplaint.status === "In Progress" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("In Progress")}
                  >
                    In Progress
                  </Button>
                  <Button
                    variant={selectedComplaint.status === "Resolved" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handleStatusChange("Resolved")}
                  >
                    Resolved
                  </Button>
                </div>
              </div>

              {/* Internal Notes */}
              <div className="space-y-2">
                <Label>Internal Notes</Label>
                <div className="space-y-2">
                  {selectedComplaint.internalNotes?.map((note, idx) => (
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
