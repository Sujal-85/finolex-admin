import { useState } from "react";
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

interface Announcement {
  id: string;
  title: string;
  content: string;
  audience: "all" | "students" | "hostel-a" | "hostel-b" | "hostel-c";
  status: "draft" | "scheduled" | "published";
  scheduledDate?: string;
  pushNotification: boolean;
  createdAt: string;
}

const mockAnnouncements: Announcement[] = [
  {
    id: "1",
    title: "Weekend Menu Update",
    content: "Special dishes will be served this weekend. Check the menu for details.",
    audience: "all",
    status: "published",
    pushNotification: true,
    createdAt: "2024-01-15T10:00:00",
  },
  {
    id: "2",
    title: "Mess Timing Change",
    content: "Due to maintenance, breakfast timing will be 8:00 AM - 9:30 AM tomorrow.",
    audience: "all",
    status: "scheduled",
    scheduledDate: "2024-01-20T06:00:00",
    pushNotification: true,
    createdAt: "2024-01-14T15:30:00",
  },
  {
    id: "3",
    title: "Block A - Water Supply",
    content: "Water supply will be interrupted from 2 PM to 4 PM for repairs.",
    audience: "hostel-a",
    status: "published",
    pushNotification: false,
    createdAt: "2024-01-13T09:00:00",
  },
];

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>(mockAnnouncements);
  const [showModal, setShowModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [viewingAnnouncement, setViewingAnnouncement] = useState<Announcement | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [audienceFilter, setAudienceFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    audience: "all" as Announcement["audience"],
    scheduledDate: "",
    pushNotification: false,
  });

  const filteredAnnouncements = announcements.filter(a => {
    const matchesSearch = a.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         a.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesAudience = audienceFilter === "all" || a.audience === audienceFilter;
    const matchesStatus = statusFilter === "all" || a.status === statusFilter;
    return matchesSearch && matchesAudience && matchesStatus;
  });

  const handleCreate = () => {
    setEditingAnnouncement(null);
    setFormData({
      title: "",
      content: "",
      audience: "all",
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
      audience: announcement.audience,
      scheduledDate: announcement.scheduledDate || "",
      pushNotification: announcement.pushNotification,
    });
    setShowModal(true);
  };

  const handleSave = () => {
    if (!formData.title || !formData.content) {
      toast({
        title: "Validation Error",
        description: "Title and content are required.",
        variant: "destructive",
      });
      return;
    }

    const status: Announcement["status"] = formData.scheduledDate ? "scheduled" : "published";

    if (editingAnnouncement) {
      setAnnouncements(announcements.map(a =>
        a.id === editingAnnouncement.id
          ? {
              ...a,
              title: formData.title,
              content: formData.content,
              audience: formData.audience,
              status,
              scheduledDate: formData.scheduledDate || undefined,
              pushNotification: formData.pushNotification,
            }
          : a
      ));
      toast({ title: "Announcement Updated", description: "Changes saved successfully." });
    } else {
      const newAnnouncement: Announcement = {
        id: `${announcements.length + 1}`,
        title: formData.title,
        content: formData.content,
        audience: formData.audience,
        status,
        scheduledDate: formData.scheduledDate || undefined,
        pushNotification: formData.pushNotification,
        createdAt: new Date().toISOString(),
      };
      setAnnouncements([newAnnouncement, ...announcements]);
      toast({
        title: status === "scheduled" ? "Announcement Scheduled" : "Announcement Published",
        description: status === "scheduled"
          ? `Will be published on ${format(new Date(formData.scheduledDate), "MMM dd, yyyy 'at' hh:mm a")}`
          : "Announcement is now live.",
      });
    }

    setShowModal(false);
  };

  const handleDelete = () => {
    if (deletingId) {
      setAnnouncements(announcements.filter(a => a.id !== deletingId));
      toast({ title: "Announcement Deleted", description: "Announcement removed successfully." });
      setShowDeleteModal(false);
      setDeletingId(null);
    }
  };

  const getStatusBadge = (status: Announcement["status"]) => {
    const variants = {
      draft: { variant: "secondary" as const, label: "Draft" },
      scheduled: { variant: "outline" as const, label: "Scheduled" },
      published: { variant: "default" as const, label: "Published" },
    };
    const { variant, label } = variants[status];
    return <Badge variant={variant}>{label}</Badge>;
  };

  const getAudienceLabel = (audience: Announcement["audience"]) => {
    const labels = {
      all: "All Students",
      students: "Students Only",
      "hostel-a": "Block A",
      "hostel-b": "Block B",
      "hostel-c": "Block C",
    };
    return labels[audience];
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
                <SelectItem value="all">All Students</SelectItem>
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
          <Card key={announcement.id}>
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
                      <span>To: {getAudienceLabel(announcement.audience)}</span>
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
                      setDeletingId(announcement.id);
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
              <p className="text-muted-foreground">No announcements found.</p>
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
                  value={formData.audience}
                  onValueChange={(value: Announcement["audience"]) =>
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
                <p className="mt-1">{viewingAnnouncement && getAudienceLabel(viewingAnnouncement.audience)}</p>
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
