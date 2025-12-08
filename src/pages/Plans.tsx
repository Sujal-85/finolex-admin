import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Users, Check } from "lucide-react";
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
  });
  const [isLoading, setIsLoading] = useState(true); // Add isLoading state

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



  if (isLoading) {
    return <Loader />;
  }

  const handleAddNew = () => {
    setEditingPlan(null);
    setFormData({ name: "", type: "basic", price: "", features: "" });
    setShowModal(true);
  };

  const handleEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      type: plan.type,
      price: plan.price.toString(),
      features: plan.features.join(", "),
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

              <div className="space-y-2">
                {plan.features.map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-success" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 pt-2 border-t">
                <Users className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">
                  {plan.subscriberCount} subscribers
                </span>
              </div>
            </CardContent>
            <CardFooter>
              <div className="flex items-center justify-between w-full">
                <Label htmlFor={`active-${plan._id}`}>Active</Label>
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

            <div className="space-y-2">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Textarea
                id="features"
                value={formData.features}
                onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                placeholder="Breakfast, Lunch, Dinner, Weekend Specials"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              {editingPlan ? "Update" : "Create"} Plan
            </Button>
          </DialogFooter>
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
