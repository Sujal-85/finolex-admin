import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Star, Check, ChevronLeft, ChevronRight } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import api from "@/api/client";

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  allergens?: string[];
  isSpecial: boolean;
  price: number;
  category: string;
  day?: string;
  mealType?: string;
}

interface DayMenu {
  breakfast: MenuItem[];
  lunch: MenuItem[];
  dinner: MenuItem[];
}

interface WeekMenu {
  [key: string]: DayMenu;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

export default function Menu() {
  const [weekMenu, setWeekMenu] = useState<WeekMenu>({});
  const [selectedDay, setSelectedDay] = useState<string>(daysOfWeek[0]);
  const [showItemModal, setShowItemModal] = useState(false);
  const [editingItem, setEditingItem] = useState<{ item: MenuItem; mealType: keyof DayMenu } | null>(null);
  const [selectedMealType, setSelectedMealType] = useState<keyof DayMenu>("breakfast");
  const [isPublished, setIsPublished] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    allergens: "",
    isSpecial: false,
    price: 0,
    category: "General"
  });

  useEffect(() => {
    fetchMenu();
  }, []);

  const fetchMenu = async () => {
    try {
      const response = await api.get('/menu');
      const items: MenuItem[] = response.data;

      const newWeekMenu: WeekMenu = {};
      daysOfWeek.forEach(day => {
        newWeekMenu[day] = { breakfast: [], lunch: [], dinner: [] };
      });

      items.forEach(item => {
        if (item.day && item.mealType) {
          if (!newWeekMenu[item.day]) {
            newWeekMenu[item.day] = { breakfast: [], lunch: [], dinner: [] };
          }
          // @ts-ignore
          if (newWeekMenu[item.day][item.mealType]) {
            // @ts-ignore
            newWeekMenu[item.day][item.mealType].push(item);
          }
        }
      });
      setWeekMenu(newWeekMenu);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch menu items",
        variant: "destructive",
      });
    }
  };

  const dayIndex = daysOfWeek.indexOf(selectedDay);
  const currentDayMenu = weekMenu[selectedDay] || { breakfast: [], lunch: [], dinner: [] };

  const handlePreviousDay = () => {
    const newIndex = (dayIndex - 1 + daysOfWeek.length) % daysOfWeek.length;
    setSelectedDay(daysOfWeek[newIndex]);
  };

  const handleNextDay = () => {
    const newIndex = (dayIndex + 1) % daysOfWeek.length;
    setSelectedDay(daysOfWeek[newIndex]);
  };

  const handleAddItem = (mealType: keyof DayMenu) => {
    setEditingItem(null);
    setSelectedMealType(mealType);
    setFormData({ name: "", description: "", allergens: "", isSpecial: false, price: 0, category: "General" });
    setShowItemModal(true);
  };

  const handleEditItem = (item: MenuItem, mealType: keyof DayMenu) => {
    setEditingItem({ item, mealType });
    setSelectedMealType(mealType);
    setFormData({
      name: item.name,
      description: item.description,
      allergens: item.allergens?.join(", ") || "",
      isSpecial: item.isSpecial,
      price: item.price,
      category: item.category
    });
    setShowItemModal(true);
  };

  const handleSaveItem = async () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Item name is required.",
        variant: "destructive",
      });
      return;
    }

    const allergens = formData.allergens
      .split(",")
      .map(a => a.trim())
      .filter(a => a);

    const itemData = {
      name: formData.name,
      description: formData.description,
      allergens: allergens,
      isSpecial: formData.isSpecial,
      price: formData.price,
      category: formData.category,
      day: selectedDay,
      mealType: selectedMealType
    };

    try {
      if (editingItem) {
        await api.patch(`/menu/${editingItem.item._id}`, itemData);
      } else {
        await api.post('/menu', itemData);
      }

      await fetchMenu();

      toast({
        title: editingItem ? "Item Updated" : "Item Added",
        description: `Menu item ${editingItem ? "updated" : "added"} successfully.`,
      });

      setShowItemModal(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save menu item",
        variant: "destructive",
      });
    }
  };

  const handleDeleteItem = async (itemId: string, mealType: keyof DayMenu) => {
    try {
      await api.delete(`/menu/${itemId}`);
      await fetchMenu();
      toast({ title: "Item Deleted", description: "Menu item removed successfully." });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    }
  };

  const handlePublish = () => {
    setIsPublished(!isPublished);
    toast({
      title: isPublished ? "Menu Unpublished" : "Menu Published",
      description: isPublished
        ? "Menu has been unpublished from today's display."
        : "Menu is now live on today's menu display.",
    });
  };

  const renderMealSection = (title: string, mealType: keyof DayMenu, items: MenuItem[]) => (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>{title}</CardTitle>
            <CardDescription>{items?.length || 0} items</CardDescription>
          </div>
          <Button size="sm" onClick={() => handleAddItem(mealType)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {(!items || items.length === 0) ? (
          <p className="text-sm text-muted-foreground text-center py-4">No items added yet</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item._id}
                className="flex items-start justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">{item.name}</h4>
                    {item.isSpecial && (
                      <Badge variant="outline" className="bg-warning/10 text-warning border-warning">
                        <Star className="h-3 w-3 mr-1" />
                        Special
                      </Badge>
                    )}
                    <Badge variant="secondary" className="text-xs">₹{item.price}</Badge>
                  </div>
                  {item.description && (
                    <p className="text-sm text-muted-foreground">{item.description}</p>
                  )}
                  {item.allergens && item.allergens.length > 0 && (
                    <div className="flex gap-1 mt-1">
                      {item.allergens.map((allergen, idx) => (
                        <Badge key={idx} variant="secondary" className="text-xs">
                          {allergen}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
                <div className="flex gap-1 ml-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEditItem(item, mealType)}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteItem(item._id, mealType)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Manage daily and weekly menu</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Label htmlFor="publish">Publish Today's Menu</Label>
            <Switch id="publish" checked={isPublished} onCheckedChange={handlePublish} />
          </div>
        </div>
      </div>

      {/* Day Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={handlePreviousDay}>
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto md:justify-center">
              {daysOfWeek.map((day) => (
                <Button
                  key={day}
                  variant={day === selectedDay ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDay(day)}
                  className="min-w-[100px] shrink-0"
                >
                  {day}
                </Button>
              ))}
            </div>

            <Button variant="outline" size="sm" onClick={handleNextDay}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Meal Sections */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-2">
        {renderMealSection("Breakfast", "breakfast", currentDayMenu.breakfast)}
        {renderMealSection("Lunch", "lunch", currentDayMenu.lunch)}
        {renderMealSection("Dinner", "dinner", currentDayMenu.dinner)}
      </div>

      {/* Add/Edit Item Modal */}
      <Dialog open={showItemModal} onOpenChange={setShowItemModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingItem ? "Edit Menu Item" : "Add Menu Item"}</DialogTitle>
            <DialogDescription>
              {selectedMealType.charAt(0).toUpperCase() + selectedMealType.slice(1)} for {selectedDay}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="itemName">Item Name *</Label>
              <Input
                id="itemName"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Idli Sambar"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price (₹) *</Label>
              <Input
                id="price"
                type="number"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                placeholder="e.g., 50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Brief description of the dish"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="allergens">Allergens (comma-separated)</Label>
              <Input
                id="allergens"
                value={formData.allergens}
                onChange={(e) => setFormData({ ...formData, allergens: e.target.value })}
                placeholder="e.g., Dairy, Nuts, Gluten"
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="special">Mark as Special</Label>
              <Switch
                id="special"
                checked={formData.isSpecial}
                onCheckedChange={(checked) => setFormData({ ...formData, isSpecial: checked })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowItemModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveItem}>
              {editingItem ? "Update" : "Add"} Item
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
