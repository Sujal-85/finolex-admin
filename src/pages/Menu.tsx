import { useState } from "react";
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

interface MenuItem {
  id: string;
  name: string;
  description: string;
  allergens?: string[];
  isSpecial: boolean;
}

interface DayMenu {
  breakfast: MenuItem[];
  lunch: MenuItem[];
  snacks: MenuItem[];
  dinner: MenuItem[];
}

interface WeekMenu {
  [key: string]: DayMenu;
}

const daysOfWeek = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const mockWeekMenu: WeekMenu = {
  Monday: {
    breakfast: [
      { id: "1", name: "Idli Sambar", description: "Steamed rice cakes with lentil soup", isSpecial: false },
      { id: "2", name: "Poha", description: "Flattened rice with vegetables", isSpecial: false },
    ],
    lunch: [
      { id: "3", name: "Dal Tadka", description: "Yellow lentils with spices", isSpecial: false },
      { id: "4", name: "Paneer Butter Masala", description: "Cottage cheese in rich gravy", isSpecial: true },
    ],
    snacks: [
      { id: "5", name: "Samosa", description: "Fried pastry with spiced filling", isSpecial: false },
    ],
    dinner: [
      { id: "6", name: "Chicken Curry", description: "Spiced chicken curry", allergens: ["Dairy"], isSpecial: false },
      { id: "7", name: "Roti", description: "Wheat flatbread", isSpecial: false },
    ],
  },
};

export default function Menu() {
  const [weekMenu, setWeekMenu] = useState<WeekMenu>(mockWeekMenu);
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
  });

  const dayIndex = daysOfWeek.indexOf(selectedDay);
  const currentDayMenu = weekMenu[selectedDay] || { breakfast: [], lunch: [], snacks: [], dinner: [] };

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
    setFormData({ name: "", description: "", allergens: "", isSpecial: false });
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
    });
    setShowItemModal(true);
  };

  const handleSaveItem = () => {
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

    const newItem: MenuItem = {
      id: editingItem?.item.id || `${Date.now()}`,
      name: formData.name,
      description: formData.description,
      allergens: allergens.length > 0 ? allergens : undefined,
      isSpecial: formData.isSpecial,
    };

    setWeekMenu(prev => {
      const updatedDay = { ...prev[selectedDay] };
      
      if (editingItem) {
        updatedDay[selectedMealType] = updatedDay[selectedMealType].map(item =>
          item.id === editingItem.item.id ? newItem : item
        );
      } else {
        updatedDay[selectedMealType] = [...updatedDay[selectedMealType], newItem];
      }

      return { ...prev, [selectedDay]: updatedDay };
    });

    toast({
      title: editingItem ? "Item Updated" : "Item Added",
      description: `Menu item ${editingItem ? "updated" : "added"} successfully.`,
    });

    setShowItemModal(false);
  };

  const handleDeleteItem = (itemId: string, mealType: keyof DayMenu) => {
    setWeekMenu(prev => ({
      ...prev,
      [selectedDay]: {
        ...prev[selectedDay],
        [mealType]: prev[selectedDay][mealType].filter(item => item.id !== itemId),
      },
    }));

    toast({ title: "Item Deleted", description: "Menu item removed successfully." });
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
            <CardDescription>{items.length} items</CardDescription>
          </div>
          <Button size="sm" onClick={() => handleAddItem(mealType)}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">No items added yet</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={item.id}
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
                    onClick={() => handleDeleteItem(item.id, mealType)}
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Menu Management</h1>
          <p className="text-muted-foreground">Manage daily and weekly menu</p>
        </div>
        <div className="flex items-center gap-4">
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
            
            <div className="flex gap-2">
              {daysOfWeek.map((day) => (
                <Button
                  key={day}
                  variant={day === selectedDay ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDay(day)}
                  className="min-w-[100px]"
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
      <div className="grid gap-6 md:grid-cols-2">
        {renderMealSection("Breakfast", "breakfast", currentDayMenu.breakfast)}
        {renderMealSection("Lunch", "lunch", currentDayMenu.lunch)}
        {renderMealSection("Snacks", "snacks", currentDayMenu.snacks)}
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
