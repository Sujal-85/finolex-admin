import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Check, FileText, Eye, Upload, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import api from "@/api/client";
import { Loader } from "@/components/ui/loader";

interface Plan {
  _id: string;
  name: string;
  type: "basic" | "standard" | "premium";
  price: number;
  features: string[];
  active: boolean;
  subscriberCount: number;
  startDate?: string;
  endDate?: string;
  rebatePdfUrl?: string;
}

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deletingPlan, setDeletingPlan] = useState<Plan | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    type: "basic" as Plan["type"],
    price: "",
    features: "",
    startDate: "",
    endDate: "",
    rebatePdfUrl: "",
  });
  const [isUploading, setIsUploading] = useState(false);
  const [activePdfUrl, setActivePdfUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/plans');
      setPlans(response.data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch plans",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNew = () => {
    setEditingPlan(null);
    setFormData({ name: "", type: "basic", price: "", features: "", startDate: "", endDate: "", rebatePdfUrl: "" });
    setShowModal(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: plan.type,
      price: plan.price.toString(),
      features: plan.features.join(", "),
      startDate: plan.startDate ? new Date(plan.startDate).toISOString().split('T')[0] : "",
      endDate: plan.endDate ? new Date(plan.endDate).toISOString().split('T')[0] : "",
      rebatePdfUrl: plan.rebatePdfUrl || "",
    });
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const features = formData.features.split(",").map(f => f.trim()).filter(f => f);
    const planData = {
      name: formData.name,
      type: formData.type,
      price: Number(formData.price),
      features,
      startDate: formData.startDate || undefined,
      endDate: formData.endDate || undefined,
      rebatePdfUrl: formData.rebatePdfUrl || undefined,
    };

    try {
      if (editingPlan) {
        await api.patch(`/plans/${editingPlan._id}`, planData);
        toast({ title: "Plan Updated", description: "Mess plan updated successfully." });
      } else {
        await api.post('/plans', planData);
        toast({ title: "Plan Created", description: "New mess plan created successfully." });
      }
      fetchPlans();
      setShowModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save plan",
        variant: "destructive",
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast({
        title: "Invalid File",
        description: "Please upload a PDF file only.",
        variant: "destructive",
      });
      return;
    }

    const uploadData = new FormData();
    uploadData.append("pdf", file);

    setIsUploading(true);
    try {
      const response = await api.post("/upload/rebate-pdf", uploadData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      // Prefer secure_url if provided by Cloudinary SDK through backend
      const pdfUrl = response.data.pdfUrl.trim();
      setFormData({ ...formData, rebatePdfUrl: pdfUrl });
      toast({ title: "Upload Success", description: "Rebate PDF uploaded successfully." });
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: "Failed to upload Rebate PDF.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleToggleActive = async (plan: Plan) => {
    if (plan.subscriberCount > 0 && plan.active) {
      toast({
        title: "Cannot Deactivate",
        description: `This plan has ${plan.subscriberCount} active subscribers.`,
        variant: "destructive",
      });
      return;
    }

    try {
      await api.patch(`/plans/${plan._id}`, { active: !plan.active });
      toast({
        title: plan.active ? "Plan Deactivated" : "Plan Activated",
        description: `${plan.name} has been ${plan.active ? "deactivated" : "activated"}.`,
      });
      fetchPlans();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update plan status",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async () => {
    if (deletingPlan) {
      try {
        await api.delete(`/plans/${deletingPlan._id}`);
        toast({ title: "Plan Deleted", description: "Mess plan deleted successfully." });
        setShowDeleteModal(false);
        setDeletingPlan(null);
        fetchPlans();
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete plan",
          variant: "destructive",
        });
      }
    }
  };

  const getPlanBadge = (type: Plan["type"]) => {
    const variants = {
      basic: "secondary",
      standard: "default",
      premium: "outline",
    };
    return <Badge variant={variants[type] as any}>{type.charAt(0).toUpperCase() + type.slice(1)}</Badge>;
  };

  if (isLoading) {
    return <Loader />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Plans & Pricing</h1>
          <p className="text-muted-foreground">Configure mess plans and pricing</p>
        </div>
        <Button onClick={handleAddNew}>
          <Plus className="h-4 w-4 mr-2" />
          Add New Plan
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan._id} className={`relative ${!plan.active && "opacity-60"}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>{plan.name}</CardTitle>
                  <div className="text-sm text-muted-foreground">{getPlanBadge(plan.type)}</div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => handleEdit(plan)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setDeletingPlan(plan);
                      setShowDeleteModal(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-3xl font-bold">₹{plan.price.toLocaleString()}</p>
                <p className="text-sm text-muted-foreground">per month</p>
              </div>

              {plan.startDate && plan.endDate && (
                <div className="text-xs text-muted-foreground bg-muted p-2 rounded-md">
                  <p className="font-semibold">Working Period:</p>
                  <p>{new Date(plan.startDate).toLocaleDateString()} - {new Date(plan.endDate).toLocaleDateString()}</p>
                </div>
              )}

              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between pt-2 border-t">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {plan.subscriberCount} subscribers
                  </span>
                </div>
                {plan.rebatePdfUrl && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                    onClick={() => setActivePdfUrl(plan.rebatePdfUrl || null)}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="text-xs font-medium">Rebate Info</span>
                  </Button>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <Label htmlFor={`active-${plan._id}`}>Active Status</Label>
                <Switch
                  id={`active-${plan._id}`}
                  checked={plan.active}
                  onCheckedChange={() => handleToggleActive(plan)}
                />
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Add/Edit Modal */}
      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create New Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update plan details" : "Add a new mess plan"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Plan Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Basic Mess Plan"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Monthly Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="3500"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Breakfast, Lunch, Dinner, Weekend Specials"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Rebate Policy PDF</Label>
              {formData.rebatePdfUrl ? (
                <div className="flex items-center justify-between p-2 border rounded-md bg-muted/30">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="h-4 w-4 text-blue-500 shrink-0" />
                    <span className="text-xs truncate max-w-[150px]">Rebate_Policy.pdf</span>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setActivePdfUrl(formData.rebatePdfUrl)}
                      className="h-8 w-8 p-0"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                      onClick={() => setFormData({ ...formData, rebatePdfUrl: "" })}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid w-full items-center gap-1.5">
                  <Input
                    id="rebatePdf"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileUpload}
                    className="cursor-pointer"
                    disabled={isUploading}
                  />
                  {isUploading && <p className="text-xs text-muted-foreground animate-pulse">Uploading...</p>}
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={isUploading}>
              {editingPlan ? "Update" : "Create"} Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* PDF Preview Modal */}
      <Dialog open={!!activePdfUrl} onOpenChange={(open) => !open && setActivePdfUrl(null)}>
        <DialogContent className="max-w-4xl w-[90vw] h-[90vh] p-0 flex flex-col">
          <DialogHeader className="p-4 border-b flex-row items-center justify-between space-y-0">
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-blue-500" />
              Rebate Policy Preview
            </DialogTitle>
            <Button
              variant="outline"
              size="sm"
              asChild
              className="mr-6"
            >
              <a href={activePdfUrl || "#"} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
                <ExternalLink className="h-4 w-4" />
                Full Screen
              </a>
            </Button>
          </DialogHeader>
          <div className="flex-1 w-full overflow-hidden bg-slate-50 flex flex-col items-center justify-center p-0 relative min-h-[400px]">
            {activePdfUrl ? (
              <>
                <iframe
                  key={activePdfUrl}
                  src={activePdfUrl}
                  className="w-full h-full border-none relative z-10"
                  title="PDF Preview"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 z-0">
                  <FileText className="h-10 w-10 text-slate-300 mb-2" />
                  <p className="text-sm text-slate-500 mb-4 px-6 text-center">
                    If the preview doesn't load, your browser might be blocking it.
                  </p>
                  <div className="flex gap-2">
                    <Button asChild variant="outline" size="sm">
                      <a href={activePdfUrl} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        Open in New Tab
                      </a>
                    </Button>
                    <Button asChild variant="default" size="sm">
                      <a href={activePdfUrl} download="Rebate_Policy.pdf" className="flex items-center gap-2">
                        <Upload className="h-4 w-4 rotate-180" />
                        Download PDF
                      </a>
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
                <FileText className="h-12 w-12 opacity-20 mb-4" />
                <p>No document selected for preview</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Plan</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingPlan?.name}"?
              {deletingPlan && deletingPlan.subscriberCount > 0 && (
                <span className="block mt-2 text-destructive font-medium">
                  Warning: This plan has {deletingPlan.subscriberCount} active subscribers.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete Plan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
