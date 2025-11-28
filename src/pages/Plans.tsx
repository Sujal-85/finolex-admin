import { useState } from "react";
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

interface Plan {
  id: string;
  name: string;
  type: "basic" | "standard" | "premium";
  price: number;
  features: string[];
  active: boolean;
  subscriberCount: number;
}

const mockPlans: Plan[] = [
  {
    id: "1",
    name: "Basic Mess Plan",
    type: "basic",
    price: 3500,
    features: ["Breakfast", "Lunch", "Dinner", "Basic Menu"],
    active: true,
    subscriberCount: 150,
  },
  {
    id: "2",
    name: "Standard Mess Plan",
    type: "standard",
    price: 5000,
    features: ["Breakfast", "Lunch", "Dinner", "Evening Snacks", "Premium Menu", "Weekend Specials"],
    active: true,
    subscriberCount: 320,
  },
  {
    id: "3",
    name: "Premium Mess Plan",
    type: "premium",
    price: 6500,
    features: ["All Meals", "Premium Menu", "Weekend Specials", "Guest Meal Allowance", "Special Diet Options"],
    active: true,
    subscriberCount: 85,
  },
];

export default function Plans() {
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
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

  const handleSave = () => {
    if (!formData.name || !formData.price) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const features = formData.features.split(",").map(f => f.trim()).filter(f => f);
    
    if (editingPlan) {
      setPlans(plans.map(p => 
        p.id === editingPlan.id 
          ? { ...p, name: formData.name, type: formData.type, price: Number(formData.price), features }
          : p
      ));
      toast({ title: "Plan Updated", description: "Mess plan updated successfully." });
    } else {
      const newPlan: Plan = {
        id: `${plans.length + 1}`,
        name: formData.name,
        type: formData.type,
        price: Number(formData.price),
        features,
        active: true,
        subscriberCount: 0,
      };
      setPlans([...plans, newPlan]);
      toast({ title: "Plan Created", description: "New mess plan created successfully." });
    }
    
    setShowModal(false);
  };

  const handleToggleActive = (plan: Plan) => {
    if (plan.subscriberCount > 0 && plan.active) {
      toast({
        title: "Cannot Deactivate",
        description: `This plan has ${plan.subscriberCount} active subscribers.`,
        variant: "destructive",
      });
      return;
    }

    setPlans(plans.map(p => 
      p.id === plan.id ? { ...p, active: !p.active } : p
    ));
    
    toast({
      title: plan.active ? "Plan Deactivated" : "Plan Activated",
      description: `${plan.name} has been ${plan.active ? "deactivated" : "activated"}.`,
    });
  };

  const handleDelete = () => {
    if (deletingPlan) {
      setPlans(plans.filter(p => p.id !== deletingPlan.id));
      toast({ title: "Plan Deleted", description: "Mess plan deleted successfully." });
      setShowDeleteModal(false);
      setDeletingPlan(null);
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
          <Card key={plan.id} className={`relative ${!plan.active && "opacity-60"}`}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>{getPlanBadge(plan.type)}</CardDescription>
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
                <Label htmlFor={`active-${plan.id}`}>Active</Label>
                <Switch
                  id={`active-${plan.id}`}
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
                placeholder="5000"
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
