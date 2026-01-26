import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, Lock, Mail, Shield, User } from "lucide-react";
import { useState, useRef } from "react";
import { toast } from "sonner";

export default function Profile() {
    const [isLoading, setIsLoading] = useState(false);
    const [user, setUser] = useState(() => {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : {
            name: 'Admin User',
            email: 'admin@finolex.edu',
            role: 'Super Admin',
            avatar: '/avatars/admin.png'
        };
    });

    const [avatarUrl, setAvatarUrl] = useState(user.avatar || "/avatars/admin.png");
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSave = () => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            try {
                // Update localStorage
                const updatedUser = { ...user, avatar: avatarUrl };
                localStorage.setItem('user', JSON.stringify(updatedUser));
                setUser(updatedUser);

                // Dispatch event to update navbar
                window.dispatchEvent(new Event('userUpdated'));

                setIsLoading(false);
                toast.success("Profile updated successfully!");
            } catch (error) {
                console.error("Storage error:", error);
                setIsLoading(false);
                toast.error("Failed to save profile locally (Storage Full). Try a smaller image.");
            }
        }, 1000);
    };

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            // Check file size (limit to 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast.error("Image is too large. Please select an image under 5MB.");
                return;
            }

            const formData = new FormData();
            formData.append('avatar', file);

            const toastId = toast.loading("Uploading avatar...");

            try {
                // Determine API base URL (handling localhost vs relative)
                const baseURL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
                const uploadURL = `${baseURL}/upload/avatar`;
                const token = localStorage.getItem('token');

                const response = await fetch(uploadURL, {
                    method: 'POST',
                    body: formData,
                    headers: {
                        'Authorization': `Bearer ${token}`
                        // Content-Type is auto-set by browser for FormData
                    }
                });

                if (!response.ok) {
                    throw new Error("Upload failed");
                }

                const data = await response.json();

                // Update state
                setAvatarUrl(data.avatar);
                const updatedUser = { ...user, avatar: data.avatar };
                setUser(updatedUser);

                // Update local storage
                localStorage.setItem('user', JSON.stringify(updatedUser));

                // Dispatch event
                window.dispatchEvent(new Event('userUpdated'));

                toast.success("Avatar uploaded and profile updated!", { id: toastId });

            } catch (error) {
                console.error("Upload error:", error);
                toast.error("Failed to upload avatar", { id: toastId });
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Profile & Settings</h1>
                <p className="text-muted-foreground">Manage your account settings and preferences.</p>
            </div>

            <Tabs defaultValue="general" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="general">General</TabsTrigger>
                    <TabsTrigger value="security">Security</TabsTrigger>
                    <TabsTrigger value="notifications">Notifications</TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Profile Information</CardTitle>
                            <CardDescription>Update your personal information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="flex items-center gap-4">
                                <Avatar className="h-20 w-20">
                                    <AvatarImage src={avatarUrl} />
                                    <AvatarFallback className="text-lg bg-primary text-primary-foreground">{user.name?.substring(0, 2).toUpperCase() || 'AD'}</AvatarFallback>
                                </Avatar>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    className="hidden"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                />
                                <Button variant="outline" onClick={handleAvatarClick}>Change Avatar</Button>
                            </div>
                            <Separator />
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Full Name</Label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="name"
                                            value={user.name}
                                            onChange={(e) => setUser({ ...user, name: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="email">Email</Label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="email"
                                            value={user.email}
                                            onChange={(e) => setUser({ ...user, email: e.target.value })}
                                            className="pl-9"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="role">Role</Label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input id="role" value={user.role || 'Admin'} className="pl-9" disabled />
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={isLoading}>
                                    {isLoading ? "Saving..." : "Save Changes"}
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Security Settings</CardTitle>
                            <CardDescription>Manage your password and security preferences.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="current-password" type="password" className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="new-password" type="password" className="pl-9" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <div className="relative">
                                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input id="confirm-password" type="password" className="pl-9" />
                                </div>
                            </div>
                            <div className="flex justify-end">
                                <Button onClick={handleSave} disabled={isLoading}>
                                    Update Password
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="notifications" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Notification Preferences</CardTitle>
                            <CardDescription>Choose what you want to be notified about.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-1">
                                    <Label className="text-base">New Payments</Label>
                                    <p className="text-sm text-muted-foreground">Receive notifications when a new payment is recorded.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-1">
                                    <Label className="text-base">New Complaints</Label>
                                    <p className="text-sm text-muted-foreground">Receive notifications when a new complaint is filed.</p>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Separator />
                            <div className="flex items-center justify-between space-x-2">
                                <div className="space-y-1">
                                    <Label className="text-base">System Updates</Label>
                                    <p className="text-sm text-muted-foreground">Receive notifications about system maintenance and updates.</p>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex justify-end pt-4">
                                <Button onClick={handleSave} disabled={isLoading}>
                                    Save Preferences
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
