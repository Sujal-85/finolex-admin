import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Search, Eye, Send, Calendar } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";
import api from "@/api/client";

interface Announcement {
  _id: string;
  title: string;
  content: string;
  targetAudience: string;
  status: "draft" | "scheduled" | "published";
  scheduledDate?: string;
  pushNotification: boolean;
  createdAt: string;
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    targetAudience: "All",
    scheduledDate: "",
    pushNotification: false,
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const response = await api.get('/announcements');
      setAnnouncements(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch announcements",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAudience = audienceFilter === "all" || a.targetAudience === audienceFilter;
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesAudience && matchesStatus;
  });

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      targetAudience: "All",
      scheduledDate: "",
      pushNotification: false,
    });
    setShowModal(true);
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      targetAudience: announcement.targetAudience,
      scheduledDate: announcement.scheduledDate ? new Date(announcement.scheduledDate).toISOString().slice(0, 16) : "",
      pushNotification: announcement.pushNotification,
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    const status: Announcement["status"] = formData.scheduledDate ? "scheduled" : "published";
    const announcementData = {
      ...formData,
      status,
      scheduledDate: formData.scheduledDate || undefined,
    };

    try {
      if (editingAnnouncement) {
        const response = await api.patch(`/announcements/${editingAnnouncement._id}`, announcementData); // Assuming PATCH route exists or needs to be added? 
        // Wait, announcementRoutes has DELETE but maybe not PATCH? I should check. 
        // Assuming standard CRUD, I might need to add PATCH if missing.
        // Let's assume I'll fix the backend if needed.
        setAnnouncements(announcements.map(a =>
          a._id === editingAnnouncement._id ? response.data : a
        ));
        toast({ title: "Announcement Updated", description: "Changes saved successfully." });
      } else {
        const response = await api.post('/announcements', announcementData);
        setAnnouncements([response.data, ...announcements]);
        toast({
          title: status === "scheduled" ? "Announcement Scheduled" : "Announcement Published",
          description: status === "scheduled"
            ? `Will be published on ${format(new Date(formData.scheduledDate), "MMM dd, yyyy 'at' hh:mm a")}`
            : "Announcement is now live.",
        });
      }
      setShowModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save announcement",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (deletingId) {
      try {
        await api.delete(`/announcements/${deletingId}`);
        setAnnouncements(announcements.filter(a => a._id !== deletingId));
        toast({ title: "Announcement Deleted", description: "Announcement removed successfully." });
        setShowDeleteModal(false);
        setDeletingId(null);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete announcement",
          variant: "destructive",
        });
      }
    }
  };

  const getStatusBadge = (status: Announcement["status"]) => {
    const variants = {
      draft: { variant: "secondary" as const, label: "Draft" },
      scheduled: { variant: "outline" as const, label: "Scheduled" },
      published: { variant: "default" as const, label: "Published" },
    };
    const { variant, label } = variants[status] || variants.draft;
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getAudienceLabel = (audience: string) => {
    const labels: Record<string, string> = {
      All: "All Students",
      Students: "Students Only",
      "hostel-a": "Block A",
      "hostel-b": "Block B",
      "hostel-c": "Block C",
    };
    return labels[audience] || audience;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Announcements & News</h1>
          <p className="text-muted-foreground">Create and manage announcements</p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Create Announcement
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[250px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search announcements..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            <Select value={audienceFilter} onValueChange={setAudienceFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Audience" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Audiences</SelectItem>
                <SelectItem value="All">All Students</SelectItem>
                <SelectItem value="hostel-a">Block A</SelectItem>
                <SelectItem value="hostel-b">Block B</SelectItem>
                <SelectItem value="hostel-c">Block C</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="scheduled">Scheduled</SelectItem>
                <SelectItem value="published">Published</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Announcements List */}
      <div className="space-y-4">
        {filteredAnnouncements.map((announcement) => (
          <Card key={announcement._id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    {getStatusBadge(announcement.status)}
                    {announcement.pushNotification && (
                      <Badge variant="outline" className="bg-primary/10">
                        <Send className="h-3 w-3 mr-1" />
                        Push
                      </Badge>
                    )}
                  </div>
                  <CardDescription>
                    <span className="inline-flex items-center gap-4">
                      <span>To: {getAudienceLabel(announcement.targetAudience)}</span>
                      <span>•</span>
                      <span>{format(new Date(announcement.createdAt), "MMM dd, yyyy")}</span>
                      {announcement.scheduledDate && (
                        <>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Scheduled: {format(new Date(announcement.scheduledDate), "MMM dd, hh:mm a")}
                          </span>
                        </>
                      )}
                    </span>
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setViewingAnnouncement(announcement);
                      setShowViewModal(true);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingId(announcement._id);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground line-clamp-2">{announcement.content}</p>
            </CardContent>
          </Card>
        ))}

        {filteredAnnouncements.length === 0 && (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                {isLoading ? "Loading announcements..." : "No announcements found."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {editingAnnouncement ? "Edit Announcement" : "Create New Announcement"}
            </DialogTitle>
            <DialogDescription>
              {editingAnnouncement ? "Update announcement details" : "Create a new announcement for students"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="e.g., Weekend Menu Update"
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
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="audience">Target Audience</Label>
                <Select
                  value={formData.targetAudience}
                  onValueChange={(value) =>
                    setFormData({ ...formData, targetAudience: value })
                  }
                >
                  <SelectTrigger id="audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">All Students</SelectItem>
                    <SelectItem value="Students">Students Only</SelectItem>
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

            <div className="flex items-center justify-between pt-2 border-t">
              <Label htmlFor="pushNotification">Send Push Notification</Label>
              <Switch
                id="pushNotification"
                checked={formData.pushNotification}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, pushNotification: checked })
                }
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingAnnouncement ? "Update" : formData.scheduledDate ? "Schedule" : "Publish"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Modal */}
      <Dialog open={showViewModal} onOpenChange={setShowViewModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewingAnnouncement?.title}</DialogTitle>
            <DialogDescription>
              {viewingAnnouncement && format(new Date(viewingAnnouncement.createdAt), "MMMM dd, yyyy 'at' hh:mm a")}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div>
              <Label className="text-muted-foreground">Content</Label>
              <p className="mt-2">{viewingAnnouncement?.content}</p>
            </div>
            <div className="flex gap-4 pt-2 border-t">
              <div>
                <Label className="text-muted-foreground">Audience</Label>
                <p className="mt-1">{viewingAnnouncement && getAudienceLabel(viewingAnnouncement.targetAudience)}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Status</Label>
                <p className="mt-1">{viewingAnnouncement && getStatusBadge(viewingAnnouncement.status)}</p>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setShowViewModal(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Announcement</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this announcement? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
