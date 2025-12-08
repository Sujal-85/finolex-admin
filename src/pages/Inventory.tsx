import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Edit, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import api from "@/api/client";
import { Loader } from "@/components/ui/loader";

interface InventoryItem {
    _id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
    minThreshold: number;
    supplier: string;
    status: 'In Stock' | 'Low Stock' | 'Out of Stock';
    lastRestocked: string;
}

export default function Inventory() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [formData, setFormData] = useState({
        name: "",
        category: "",
        quantity: 0,
        unit: "kg",
        minThreshold: 10,
        supplier: "",
    });

    useEffect(() => {
        fetchInventory();
    }, []);

    const fetchInventory = async () => {
        try {
            const response = await api.get('/inventory');
            setItems(response.data);
        } catch (error) {
            toast.error("Failed to fetch inventory items");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddItem = () => {
        setEditingItem(null);
        setFormData({
            name: "",
            category: "",
            quantity: 0,
            unit: "kg",
            minThreshold: 10,
            supplier: "",
        });
        setShowModal(true);
    };

    const handleEditItem = (item: InventoryItem) => {
        setEditingItem(item);
        setFormData({
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            minThreshold: item.minThreshold,
            supplier: item.supplier || "",
        });
        setShowModal(true);
    };

    const handleSaveItem = async () => {
        if (!formData.name || !formData.category) {
            toast.error("Name and Category are required");
            return;
        }

        const itemData = {
            ...formData,
            status: formData.quantity === 0 ? 'Out of Stock' : formData.quantity <= formData.minThreshold ? 'Low Stock' : 'In Stock',
            lastRestocked: new Date()
        };

        try {
            if (editingItem) {
                await api.patch(`/inventory/${editingItem._id}`, itemData);
                toast.success("Item updated successfully");
            } else {
                await api.post('/inventory', itemData);
                toast.success("Item added successfully");
            }
            fetchInventory();
            setShowModal(false);
        } catch (error) {
            toast.error("Failed to save item");
        }
    };

    const handleDeleteItem = async (id: string) => {
        try {
            await api.delete(`/inventory/${id}`);
            toast.success("Item deleted successfully");
            fetchInventory();
        } catch (error) {
            toast.error("Failed to delete item");
        }
    };

    const filteredItems = items.filter(item =>
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
    );



    if (isLoading) {
        return <Loader />;
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Inventory</h1>
                    <p className="text-muted-foreground">Manage stock levels and suppliers</p>
                </div>
                <Button onClick={handleAddItem} className="gap-2">
                    <Plus className="h-4 w-4" /> Add Item
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle>Stock Overview</CardTitle>
                        <div className="flex items-center gap-2">
                            <div className="relative w-64">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search inventory..."
                                    className="pl-8"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Button variant="outline" size="icon">
                                <Filter className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Item Name</TableHead>
                                <TableHead>Category</TableHead>
                                <TableHead>Stock Level</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Supplier</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredItems.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                                        {isLoading ? "Loading inventory..." : "No items found"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                filteredItems.map((item) => (
                                    <TableRow key={item._id}>
                                        <TableCell className="font-medium">{item.name}</TableCell>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <span>{item.quantity} {item.unit}</span>
                                                {item.quantity <= item.minThreshold && (
                                                    <AlertTriangle className="h-4 w-4 text-warning" />
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant={
                                                item.status === 'In Stock' ? 'default' :
                                                    item.status === 'Low Stock' ? 'secondary' : 'destructive'
                                            }>
                                                {item.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>{item.supplier || "N/A"}</TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button variant="ghost" size="icon" onClick={() => handleEditItem(item)}>
                                                    <Edit className="h-4 w-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item._id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={showModal} onOpenChange={setShowModal}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingItem ? "Edit Item" : "Add New Item"}</DialogTitle>
                        <DialogDescription>Enter the details of the inventory item.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Item Name</Label>
                                <Input
                                    id="name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="e.g. Rice"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category">Category</Label>
                                <Select
                                    value={formData.category}
                                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select category" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Grains">Grains</SelectItem>
                                        <SelectItem value="Vegetables">Vegetables</SelectItem>
                                        <SelectItem value="Dairy">Dairy</SelectItem>
                                        <SelectItem value="Spices">Spices</SelectItem>
                                        <SelectItem value="Beverages">Beverages</SelectItem>
                                        <SelectItem value="Others">Others</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="quantity">Quantity</Label>
                                <Input
                                    id="quantity"
                                    type="number"
                                    value={formData.quantity}
                                    onChange={(e) => setFormData({ ...formData, quantity: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="unit">Unit</Label>
                                <Select
                                    value={formData.unit}
                                    onValueChange={(value) => setFormData({ ...formData, unit: value })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select unit" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="kg">kg</SelectItem>
                                        <SelectItem value="liters">liters</SelectItem>
                                        <SelectItem value="pcs">pcs</SelectItem>
                                        <SelectItem value="packets">packets</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="threshold">Min Threshold</Label>
                                <Input
                                    id="threshold"
                                    type="number"
                                    value={formData.minThreshold}
                                    onChange={(e) => setFormData({ ...formData, minThreshold: Number(e.target.value) })}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="supplier">Supplier</Label>
                                <Input
                                    id="supplier"
                                    value={formData.supplier}
                                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                                    placeholder="Supplier Name"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowModal(false)}>Cancel</Button>
                        <Button onClick={handleSaveItem}>Save Item</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
